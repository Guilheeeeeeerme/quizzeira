import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createFacebookGraphAdapter } from "./facebook-graph.js";
import { createGoogleCseAdapter } from "./google-cse.js";
import { createInstagramGraphAdapter } from "./instagram-graph.js";
import { createRedditPublicAdapter } from "./reddit-public.js";
import { createTelegramPublicAdapter } from "./telegram-public.js";
import { createXPublicAdapter } from "./x-public.js";
import { createYoutubeDataAdapter } from "./youtube-data.js";
import { resolveAdapters } from "./index.js";
import type { FetchLike } from "../types.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>): FetchLike {
  return async (input, init) => handler(String(input), init);
}

const CLEARED = [
  "X_BEARER_TOKEN",
  "TWITTER_BEARER_TOKEN",
  "GOOGLE_CSE_API_KEY",
  "GOOGLE_CSE_CX",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_BUSINESS_ACCOUNT_IDS",
  "FACEBOOK_ACCESS_TOKEN",
  "FACEBOOK_PAGE_IDS",
  "META_GRAPH_ACCESS_TOKEN",
  "YOUTUBE_API_KEY",
  "TELEGRAM_BOT_TOKEN",
  "REDDIT_CLIENT_ID",
  "REDDIT_CLIENT_SECRET",
  "REDDIT_SUBREDDITS",
];

describe("social adapters", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of CLEARED) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of CLEARED) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("resolveAdapters maps known ids", () => {
    const adapters = resolveAdapters(
      [
        "x-public",
        "google-cse",
        "instagram-graph",
        "facebook-graph",
        "reddit-public",
        "youtube-data",
        "telegram-public",
      ],
      false,
    );
    assert.equal(adapters.length, 7);
    assert.deepEqual(
      adapters.map((a) => a.id),
      [
        "x-public",
        "google-cse",
        "instagram-graph",
        "facebook-graph",
        "reddit-public",
        "youtube-data",
        "telegram-public",
      ],
    );
  });

  it("x-public disables without bearer", async () => {
    const result = await createXPublicAdapter().fetchRecent();
    assert.equal(result.status, "disabled");
    assert.match(result.detail ?? "", /X_BEARER_TOKEN/);
    assert.equal(result.posts.length, 0);
  });

  it("x-public maps recent search tweets", async () => {
    process.env.X_BEARER_TOKEN = "test-bearer";
    let seenQuery = "";
    const fetchFn = mockFetch((url) => {
      seenQuery = new URL(url).searchParams.get("query") ?? "";
      return jsonResponse({
        data: [
          {
            id: "99",
            text: "Edital: https://www.cebraspe.org.br/x/edital.pdf",
            created_at: "2026-09-19T12:00:00.000Z",
            entities: {
              urls: [{ expanded_url: "https://www.cebraspe.org.br/x/edital.pdf" }],
            },
          },
        ],
      });
    });
    const result = await createXPublicAdapter({
      fetchFn,
      keywords: ["concurso edital"],
    }).fetchRecent();
    assert.equal(result.status, "ok");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.platform, "x");
    assert.equal(result.posts[0]?.externalId, "99");
    assert.ok(result.posts[0]?.attachmentUrls?.includes("https://www.cebraspe.org.br/x/edital.pdf"));
    assert.match(seenQuery, /lang:pt/);
  });

  it("google-cse disables without key/cx", async () => {
    const result = await createGoogleCseAdapter().fetchRecent();
    assert.equal(result.status, "disabled");
    assert.equal(result.posts.length, 0);
  });

  it("google-cse maps CSE items", async () => {
    process.env.GOOGLE_CSE_API_KEY = "k";
    process.env.GOOGLE_CSE_CX = "cx";
    let seenUrl = "";
    const fetchFn = mockFetch((url) => {
      seenUrl = url;
      return jsonResponse({
        items: [
          {
            title: "Edital PDF",
            link: "https://portal.vunesp.com.br/edital.pdf",
            snippet: "concurso aberto",
            cacheId: "c1",
          },
        ],
      });
    });
    const result = await createGoogleCseAdapter({
      fetchFn,
      keywords: ["concurso"],
    }).fetchRecent();
    assert.equal(result.status, "ok");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.platform, "google");
    assert.match(result.posts[0]?.text ?? "", /Edital PDF/);
    const seen = new URL(seenUrl);
    assert.equal(seen.searchParams.get("lr"), "lang_pt");
    assert.equal(seen.searchParams.get("gl"), "br");
    assert.equal(seen.searchParams.get("hl"), "pt-BR");
    assert.match(seen.searchParams.get("q") ?? "", /edital/);
  });

  it("instagram-graph disables without token/ids", async () => {
    const result = await createInstagramGraphAdapter().fetchRecent();
    assert.equal(result.status, "disabled");
    assert.match(result.detail ?? "", /INSTAGRAM/);
  });

  it("instagram-graph maps media captions", async () => {
    process.env.INSTAGRAM_ACCESS_TOKEN = "tok";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_IDS = "ig1";
    const fetchFn = mockFetch(() =>
      jsonResponse({
        data: [
          {
            id: "m1",
            caption: "Saiu o edital https://www.cebraspe.org.br/edital.pdf",
            permalink: "https://www.instagram.com/p/abc/",
            timestamp: "2026-09-19T10:00:00+0000",
            media_url: "https://cdn.example/media.jpg",
          },
        ],
      }),
    );
    const result = await createInstagramGraphAdapter({ fetchFn }).fetchRecent();
    assert.equal(result.status, "ok");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.platform, "instagram");
    assert.equal(result.posts[0]?.externalId, "m1");
  });

  it("facebook-graph disables without token/pages", async () => {
    const result = await createFacebookGraphAdapter().fetchRecent();
    assert.equal(result.status, "disabled");
  });

  it("facebook-graph maps page feed posts", async () => {
    process.env.FACEBOOK_ACCESS_TOKEN = "tok";
    process.env.FACEBOOK_PAGE_IDS = "page1";
    const fetchFn = mockFetch(() =>
      jsonResponse({
        data: [
          {
            id: "page1_1",
            message: "Gabarito oficial",
            created_time: "2026-09-19T11:00:00+0000",
            permalink_url: "https://www.facebook.com/page1/posts/1",
            attachments: {
              data: [{ unshimmed_url: "https://cdn.cesgranrio.org.br/gabarito.pdf" }],
            },
          },
        ],
      }),
    );
    const result = await createFacebookGraphAdapter({ fetchFn }).fetchRecent();
    assert.equal(result.status, "ok");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.platform, "facebook");
    assert.ok(
      result.posts[0]?.attachmentUrls?.includes("https://cdn.cesgranrio.org.br/gabarito.pdf"),
    );
  });

  it("reddit-public searches public JSON with mocked listing", async () => {
    process.env.REDDIT_SUBREDDITS = "concursos";
    const fetchFn = mockFetch(() =>
      jsonResponse({
        data: {
          children: [
            {
              data: {
                id: "abc123",
                title: "Edital concurso",
                selftext: "PDF https://www.cebraspe.org.br/edital.pdf",
                url: "https://www.reddit.com/r/concursos/comments/abc123",
                permalink: "/r/concursos/comments/abc123/",
                created_utc: 1_721_000_000,
              },
            },
          ],
        },
      }),
    );
    const result = await createRedditPublicAdapter({
      fetchFn,
      keywords: ["edital"],
    }).fetchRecent();
    assert.equal(result.status, "ok");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.platform, "reddit");
    assert.equal(result.posts[0]?.feedLabel, "r/concursos");
  });

  it("youtube-data disables without key", async () => {
    const result = await createYoutubeDataAdapter().fetchRecent();
    assert.equal(result.status, "disabled");
  });

  it("youtube-data maps search snippets", async () => {
    process.env.YOUTUBE_API_KEY = "yt";
    let seenUrl = "";
    const fetchFn = mockFetch((url) => {
      seenUrl = url;
      return jsonResponse({
        items: [
          {
            id: { videoId: "vid1" },
            snippet: {
              title: "Análise do edital",
              description: "concurso 2026",
              publishedAt: "2026-09-01T00:00:00Z",
            },
          },
        ],
      });
    });
    const result = await createYoutubeDataAdapter({
      fetchFn,
      keywords: ["concurso edital"],
    }).fetchRecent();
    assert.equal(result.status, "ok");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.platform, "youtube");
    assert.match(result.posts[0]?.permalink ?? "", /vid1/);
    const seen = new URL(seenUrl);
    assert.equal(seen.searchParams.get("relevanceLanguage"), "pt");
    assert.equal(seen.searchParams.get("regionCode"), "BR");
  });

  it("telegram-public disables without bot token", async () => {
    const result = await createTelegramPublicAdapter().fetchRecent();
    assert.equal(result.status, "disabled");
  });

  it("telegram-public maps getUpdates channel posts", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "123:abc";
    const fetchFn = mockFetch(() =>
      jsonResponse({
        ok: true,
        result: [
          {
            channel_post: {
              message_id: 7,
              date: 1_721_000_100,
              text: "Edital: https://portal.vunesp.com.br/edital.pdf",
              chat: { id: -1001, username: "concursos_br" },
              entities: [{ type: "url", offset: 8, length: 40 }],
            },
          },
        ],
      }),
    );
    const result = await createTelegramPublicAdapter({ fetchFn }).fetchRecent();
    assert.equal(result.status, "ok");
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0]?.platform, "telegram");
    assert.equal(result.posts[0]?.externalId, "-1001:7");
  });

  it("adapters return error on HTTP failure when keyed", async () => {
    process.env.X_BEARER_TOKEN = "tok";
    const fetchFn = mockFetch(() => jsonResponse({ errors: [{ message: "nope" }] }, 401));
    const result = await createXPublicAdapter({
      fetchFn,
      keywords: ["x"],
    }).fetchRecent();
    assert.equal(result.status, "error");
    assert.equal(result.posts.length, 0);
  });
});
