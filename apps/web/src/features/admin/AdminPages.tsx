import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import { Heading, Stack, Text, Button, EmptyState, PageSkeleton, Surface } from "../../ui";
import styles from "./Admin.module.css";

export function AdminLayout() {
  const t = useT();
  return (
    <Stack gap={8}>
      <header>
        <Heading level={1} size="page">
          {t("Admin")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Source registry, exams, and quality HITL queue.")}
        </Text>
      </header>
      <nav className={styles.tabs} aria-label={t("Admin")}>
        <NavLink to="/admin/sources" className={({ isActive }) => (isActive ? styles.active : undefined)}>
          {t("Sources")}
        </NavLink>
        <NavLink to="/admin/exams" className={({ isActive }) => (isActive ? styles.active : undefined)}>
          {t("Exams")}
        </NavLink>
        <NavLink to="/admin/quality" className={({ isActive }) => (isActive ? styles.active : undefined)}>
          {t("Quality queue")}
        </NavLink>
      </nav>
      <Outlet />
    </Stack>
  );
}

export function AdminSourcesPage() {
  const t = useT();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [proposals, setProposals] = useState<Array<Record<string, unknown>>>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [startUrl, setStartUrl] = useState("");

  async function load() {
    const [sources, props] = await Promise.all([
      api<{ items: Array<Record<string, unknown>> }>("/admin/sources"),
      api<{ items: Array<Record<string, unknown>> }>("/admin/source-proposals"),
    ]);
    setItems(sources.items);
    setProposals(props.items);
  }

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [t]);

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={6}>
      {error ? (
        <Text tone="danger" role="alert">
          {error}
        </Text>
      ) : null}
      <Surface className={styles.panel}>
        <Heading level={2} size="card">
          {t("Add source")}
        </Heading>
        <div className={styles.formRow}>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="domain.example"
            aria-label="domain"
          />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Name")} aria-label="name" />
          <input
            value={startUrl}
            onChange={(e) => setStartUrl(e.target.value)}
            placeholder="https://..."
            aria-label="start url"
          />
          <Button
            onClick={() => {
              void (async () => {
                try {
                  await api("/admin/sources", {
                    method: "POST",
                    body: JSON.stringify({
                      domain,
                      name: name || domain,
                      startUrls: startUrl ? [startUrl] : [`https://${domain}/`],
                      linkPatterns: ["edital", "prova", "inscri"],
                      openPatterns: ["inscri", "aberto", "edital"],
                      trust: "medium",
                      status: "active",
                      enabled: true,
                    }),
                  });
                  setDomain("");
                  setName("");
                  setStartUrl("");
                  await load();
                } catch (err) {
                  setError(localizeApiError(err instanceof Error ? err.message : "Failed", t));
                }
              })();
            }}
          >
            {t("Save")}
          </Button>
        </div>
      </Surface>

      {items.length === 0 ? (
        <EmptyState title={t("No sources yet.")} />
      ) : (
        <Stack gap={3}>
          {items.map((s) => (
            <Surface key={String(s.id)} className={styles.row}>
              <div>
                <Text>{String(s.name)}</Text>
                <Text tone="secondary" size="caption">
                  {String(s.domain)} · {String(s.status)} · interval {String(s.intervalSec)}s
                </Text>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  void (async () => {
                    await api(`/admin/sources/${String(s.id)}`, {
                      method: "PATCH",
                      body: JSON.stringify({ enabled: !s.enabled }),
                    });
                    await load();
                  })();
                }}
              >
                {s.enabled ? t("Disable") : t("Enable")}
              </Button>
            </Surface>
          ))}
        </Stack>
      )}

      <Heading level={2} size="card">
        {t("Source proposals")}
      </Heading>
      {proposals.length === 0 ? (
        <EmptyState title={t("No pending proposals.")} />
      ) : (
        <Stack gap={3}>
          {proposals.map((p) => (
            <Surface key={String(p.id)} className={styles.row}>
              <Text>
                {String(p.name)} ({String(p.domain)})
              </Text>
              <div className={styles.actions}>
                <Button
                  size="sm"
                  onClick={() => {
                    void api(`/admin/source-proposals/${String(p.id)}/approve`, { method: "POST" }).then(load);
                  }}
                >
                  {t("Approve")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void api(`/admin/source-proposals/${String(p.id)}/reject`, { method: "POST" }).then(load);
                  }}
                >
                  {t("Reject")}
                </Button>
              </div>
            </Surface>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export function AdminExamsPage() {
  const t = useT();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ items: Array<Record<string, unknown>> }>("/admin/exams");
        setItems(res.items);
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [t]);

  if (booting) return <PageSkeleton />;
  if (error) {
    return (
      <Text tone="danger" role="alert">
        {error}
      </Text>
    );
  }
  if (!items.length) return <EmptyState title={t("No exams discovered yet.")} />;

  return (
    <Stack gap={3}>
      {items.map((exam) => (
        <Surface key={String(exam.id)} className={styles.row}>
          <div>
            <Text>{String(exam.title)}</Text>
            <Text tone="secondary" size="caption">
              {String(exam.examSlug)} · {String(exam.status)} · {String(exam.org || "")}
            </Text>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void (async () => {
                const next = exam.status === "open" ? "closed" : "open";
                await api(`/admin/exams/${String(exam.id)}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: next }),
                });
                const res = await api<{ items: Array<Record<string, unknown>> }>("/admin/exams");
                setItems(res.items);
              })();
            }}
          >
            {exam.status === "open" ? t("Close") : t("Reopen")}
          </Button>
        </Surface>
      ))}
    </Stack>
  );
}

interface QualityQueueItem {
  id: string;
  examSlug: string;
  subject: string;
  status: string;
  origin: string;
  prompt: string;
  qualityScore: number | null;
  qualityNotes: string | null;
  failReasons: unknown;
  sourceUrl: string | null;
}

interface ContentHealth {
  questionItems: { draft: number; needsReview: number; published: number; failed: number };
}

/** Share of decided items that passed the publish gate. */
function passRateLabel(health: ContentHealth): string {
  const { published, failed } = health.questionItems;
  const decided = published + failed;
  return decided === 0 ? "—" : `${Math.round((published / decided) * 100)}%`;
}

function reasonText(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(" · ");
  if (typeof value === "string") return value;
  return "";
}

export function AdminQualityPage() {
  const t = useT();
  const [items, setItems] = useState<QualityQueueItem[]>([]);
  const [health, setHealth] = useState<ContentHealth | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    const [queue, contentHealth] = await Promise.all([
      api<{ items: QualityQueueItem[] }>("/admin/quality/queue"),
      api<ContentHealth>("/admin/content/health"),
    ]);
    setItems(queue.items);
    setHealth(contentHealth);
  }

  async function decide(id: string, body: Record<string, string> | null) {
    try {
      await api(body ? `/admin/quality/queue/${id}` : `/admin/quality/queue/${id}/requeue`, {
        method: "POST",
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      await load();
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Failed", t));
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [t]);

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={6}>
      {error ? (
        <Text tone="danger" role="alert">
          {error}
        </Text>
      ) : null}
      {health ? (
        <Text tone="secondary" size="bodySm">
          {t("Pass rate")}: {passRateLabel(health)} · published {health.questionItems.published} ·
          failed {health.questionItems.failed} · needs review {health.questionItems.needsReview} ·
          draft {health.questionItems.draft}
        </Text>
      ) : null}
      {items.length === 0 ? (
        <EmptyState title={t("Nothing waiting for review.")} />
      ) : (
        <Stack gap={3}>
          {items.map((item) => (
            <Surface key={item.id} className={styles.panel}>
              <Text>{item.prompt}</Text>
              <Text tone="secondary" size="caption">
                {item.examSlug} · {item.subject} · {item.status} · {item.origin}
                {item.qualityScore == null ? "" : ` · score ${item.qualityScore.toFixed(2)}`}
              </Text>
              {reasonText(item.failReasons) || item.qualityNotes ? (
                <Text tone="secondary" size="caption">
                  {reasonText(item.failReasons) || item.qualityNotes}
                </Text>
              ) : null}
              <div className={styles.actions}>
                <Button size="sm" onClick={() => void decide(item.id, { decision: "published" })}>
                  {t("Force publish")}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void decide(item.id, null)}>
                  {t("Recheck")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void decide(item.id, { decision: "failed" })}
                >
                  {t("Reject")}
                </Button>
              </div>
            </Surface>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
