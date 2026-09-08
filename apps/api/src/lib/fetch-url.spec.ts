import { afterEach, describe, expect, it, vi } from "vitest";
import { assertSafeFetchUrl, fetchUrlText, isBlockedIp } from "./fetch-url";

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.LINK_FETCH_ALLOWLIST;
});

describe("isBlockedIp", () => {
  it("blocks loopback, private, link-local, and metadata ranges", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.5")).toBe(true);
    expect(isBlockedIp("172.16.1.1")).toBe(true);
    expect(isBlockedIp("192.168.1.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("100.64.1.1")).toBe(true);
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("1.1.1.1")).toBe(false);
  });
});

describe("assertSafeFetchUrl", () => {
  it("rejects metadata hostnames and literal metadata IP", async () => {
    await expect(assertSafeFetchUrl("http://metadata.google.internal/latest")).rejects.toThrow(
      /Blocked hostname/,
    );
    await expect(assertSafeFetchUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      /Blocked IP/,
    );
  });

  it("rejects private literal IPs used as hosts", async () => {
    await expect(assertSafeFetchUrl("http://10.0.0.9/path")).rejects.toThrow(/Blocked IP/);
    await expect(assertSafeFetchUrl("http://192.168.0.10/path")).rejects.toThrow(/Blocked IP/);
  });

  it("honors optional LINK_FETCH_ALLOWLIST", async () => {
    process.env.LINK_FETCH_ALLOWLIST = "allowed.example";
    await expect(assertSafeFetchUrl("https://other.example/")).rejects.toThrow(/ALLOWLIST/);
    // Literal public IP bypasses DNS and passes allowlist check only on hostname —
    // non-allowlisted hostnames fail before DNS.
    await expect(assertSafeFetchUrl("https://allowed.example/")).rejects.toThrow(
      /DNS resolution failed|Resolved to a private/,
    );
  });
});

describe("fetchUrlText redirects", () => {
  it("blocks redirect hops that target private addresses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: unknown) => {
        const url = String(input);
        if (url.startsWith("http://1.1.1.1")) {
          return new Response(null, {
            status: 302,
            headers: { location: "http://169.254.169.254/secret" },
          });
        }
        return new Response("should-not-fetch", { status: 200 });
      }),
    );

    const result = await fetchUrlText("http://1.1.1.1/start");
    expect(result).toEqual({ ok: false, text: null });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
