// Concept: Source registry + HITL (admin control plane)
//
// Everything here is ADMIN-only and proxied by the study API to discovery-api
// and content-api. Nothing is seeded, so every screen has a real empty state:
// a fresh install shows zero sources until an admin adds the first one.
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { api } from "../../lib/api";
import { localizeApiError, useLocale, useT, type Translate } from "../../i18n";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  Heading,
  Input,
  PageSkeleton,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
} from "../../ui";
import styles from "./Admin.module.css";

// ── Shared types (mirror the admin JSON the proxies return) ─────────────────

interface AdminSource {
  id: string;
  domain: string;
  name: string;
  startUrls: string[];
  strategy: string;
  linkPatterns: string[];
  openPatterns: string[];
  trust: "high" | "medium" | "low";
  status: "active" | "broken" | "proposed" | "disabled";
  enabled: boolean;
  intervalSec: number;
  politenessMs: number;
  failCount: number;
  lastOkAt: string | null;
  lastError: string | null;
  notes: string | null;
}

interface SourceProposal {
  id: string;
  domain: string;
  name: string;
  startUrls: string[];
  reason: string | null;
  createdAt: string;
}

interface AdminExam {
  id: string;
  examSlug: string;
  title: string;
  org: string | null;
  banca: string | null;
  editalUrl: string | null;
  listingUrl: string;
  status: "open" | "closed" | "unknown";
  sourceDomain: string;
  artifactCount: number;
  lastSeenAt: string;
}

interface QualityItem {
  id: string;
  examSlug: string;
  subject: string;
  status: "failed" | "needs_review";
  origin: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  explanation: string | null;
  qualityScore: number | null;
  qualityNotes: string | null;
  failReasons: string[];
  sourceUrl: string | null;
  updatedAt: string;
  reviews: Array<{
    stage: string;
    decision: string;
    score: number;
    notes: string | null;
    reasons: string[];
    createdAt: string;
  }>;
}

interface PipelineHealth {
  discovery:
    | {
        sources?: { total: number; active: number; broken: number; proposed: number };
        openExams?: number;
        artifacts?: number;
        lastRun?: { runId: string; status: string; finishedAt: string | null } | null;
      }
    | { error: string };
  content:
    | {
        documents?: { pending: number; extracting: number; extracted: number; failed: number };
        chunks?: { total: number; embedded: number };
        questionItems?: {
          draft: number;
          needsReview: number;
          published: number;
          failed: number;
        };
        lastGenerationRun?: { status: string; drafted: number; error: string | null } | null;
      }
    | { error: string };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function errText(err: unknown, t: Translate): string {
  return localizeApiError(err instanceof Error ? err.message : "Action failed", t);
}

function useFormatAt() {
  const { locale } = useLocale();
  return useCallback(
    (iso: string | null | undefined): string => {
      if (!iso) return "—";
      try {
        return new Date(iso).toLocaleString(locale);
      } catch {
        return iso;
      }
    },
    [locale],
  );
}

function sourceTone(source: AdminSource): "success" | "warning" | "danger" | "neutral" {
  if (!source.enabled) return "neutral";
  if (source.status === "broken") return "danger";
  if (source.status === "active") return "success";
  return "warning";
}

/**
 * Status labels are mapped explicitly rather than interpolated into a
 * translation key, so a missing entry shows English prose instead of a raw key.
 */
function statusLabel(status: string, t: Translate): string {
  switch (status) {
    case "active":
      return t("Active");
    case "broken":
      return t("Broken");
    case "proposed":
      return t("Proposed");
    case "disabled":
      return t("Disabled");
    case "open":
      return t("Open");
    case "closed":
      return t("Closed");
    case "unknown":
      return t("Unknown");
    case "failed":
      return t("Failed");
    case "needs_review":
      return t("Needs review");
    default:
      return status;
  }
}

/** Turns a textarea of one-per-line values into an array. */
function lines(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

// ── Layout ──────────────────────────────────────────────────────────────────

export function AdminLayout() {
  const t = useT();
  const tabs = [
    { to: "/admin/sources", label: t("Sources") },
    { to: "/admin/exams", label: t("Exams") },
    { to: "/admin/quality", label: t("Quality queue") },
    { to: "/admin/health", label: t("Pipeline health") },
  ];

  return (
    <Stack gap={5}>
      <header>
        <Heading level={1} size="page">
          {t("Admin")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Manage ingestion sources, discovered exams, and the question quality queue.")}
        </Text>
      </header>

      <nav className={styles.tabs} aria-label={t("Admin sections")}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [styles.tab, isActive ? styles.tabActive : ""].filter(Boolean).join(" ")
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </Stack>
  );
}

// ── Sources ─────────────────────────────────────────────────────────────────

export function AdminSourcesPage() {
  const t = useT();
  const formatAt = useFormatAt();
  const nameId = useId();
  const urlsId = useId();
  const [sources, setSources] = useState<AdminSource[]>([]);
  const [proposals, setProposals] = useState<SourceProposal[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [startUrls, setStartUrls] = useState("");
  const [linkPatterns, setLinkPatterns] = useState("");
  const [openPatterns, setOpenPatterns] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState("30");

  const load = useCallback(async () => {
    setError("");
    try {
      const [s, p] = await Promise.all([
        api<{ items: AdminSource[] }>("/admin/sources"),
        api<{ items: SourceProposal[] }>("/admin/source-proposals"),
      ]);
      setSources(s.items);
      setProposals(p.items);
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBooting(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addSource(event: React.FormEvent) {
    event.preventDefault();
    const urls = lines(startUrls);
    if (urls.length === 0) {
      setError(t("Add at least one start URL."));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/admin/sources", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim() || undefined,
          startUrls: urls,
          linkPatterns: lines(linkPatterns),
          openPatterns: lines(openPatterns),
          intervalSec: Math.max(60, Number(intervalMinutes || 30) * 60),
        }),
      });
      setName("");
      setStartUrls("");
      setLinkPatterns("");
      setOpenPatterns("");
      setShowForm(false);
      setNotice(t("Source added. The crawler will pick it up on its next pass."));
      await load();
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setSaving(false);
    }
  }

  async function mutate(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    try {
      await api(`/admin/sources/${id}`, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBusyId(null);
    }
  }

  async function forceCrawl(sourceId?: string) {
    setBusyId(sourceId ?? "all");
    setError("");
    try {
      await api("/admin/crawl/force", {
        method: "POST",
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      });
      setNotice(t("Crawl queued. It runs on the crawler's next tick."));
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBusyId(null);
    }
  }

  async function reviewProposal(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError("");
    try {
      await api(`/admin/source-proposals/${id}/${action}`, { method: "POST" });
      await load();
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBusyId(null);
    }
  }

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={5}>
      <div className={styles.sectionHead}>
        <div>
          <Heading level={2} size="section">
            {t("Sources")}
          </Heading>
          <Text size="caption" tone="tertiary">
            {t("Portals the crawler visits. Nothing is crawled until you add one.")}
          </Text>
        </div>
        <div className={styles.sectionActions}>
          <Button
            size="sm"
            variant="secondary"
            loading={busyId === "all"}
            disabled={sources.length === 0}
            onClick={() => void forceCrawl()}
          >
            {t("Crawl now")}
          </Button>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? t("Cancel") : t("Add source")}
          </Button>
        </div>
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text size="caption" tone="secondary" aria-live="polite">
          {notice}
        </Text>
      ) : null}

      {showForm ? (
        <form className={styles.form} onSubmit={addSource}>
          <Field label={t("Name")} htmlFor={nameId}>
            <Input
              id={nameId}
              value={name}
              placeholder={t("e.g. Cesgranrio concursos")}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field
            label={t("Start URLs (one per line)")}
            htmlFor={urlsId}
            hint={t("The listing pages to crawl. The domain is derived from the first URL.")}
          >
            <Textarea
              id={urlsId}
              rows={3}
              value={startUrls}
              placeholder="https://www.example.org/concursos"
              onChange={(e) => setStartUrls(e.target.value)}
            />
          </Field>
          <Field
            label={t("Link patterns (one regex per line)")}
            hint={t("Keep only links whose text or URL matches. Empty keeps everything.")}
          >
            <Textarea
              rows={2}
              value={linkPatterns}
              placeholder="edital|concurso"
              onChange={(e) => setLinkPatterns(e.target.value)}
            />
          </Field>
          <Field
            label={t("Open patterns (one regex per line)")}
            hint={t("Marks a listing as an open registration period.")}
          >
            <Textarea
              rows={2}
              value={openPatterns}
              placeholder="inscri[cç][oõ]es abertas"
              onChange={(e) => setOpenPatterns(e.target.value)}
            />
          </Field>
          <Field label={t("Crawl interval (minutes)")}>
            <Input
              type="number"
              min={1}
              value={intervalMinutes}
              onChange={(e) => setIntervalMinutes(e.target.value)}
            />
          </Field>
          <div className={styles.formActions}>
            <Button type="submit" size="sm" loading={saving}>
              {t("Save source")}
            </Button>
          </div>
        </form>
      ) : null}

      {sources.length === 0 ? (
        <EmptyState
          title={t("No sources yet.")}
          description={t(
            "Add the first portal to crawl. Quizzeira ships with an empty registry on purpose — no seeded sources.",
          )}
          action={
            showForm ? undefined : (
              <Button size="sm" onClick={() => setShowForm(true)}>
                {t("Add source")}
              </Button>
            )
          }
        />
      ) : (
        <ul className={styles.list}>
          {sources.map((source) => (
            <li key={source.id} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.cardTitleRow}>
                  <span className={styles.cardTitle}>{source.name}</span>
                  <Badge tone={sourceTone(source)}>
                    {source.enabled ? statusLabel(source.status, t) : t("Disabled")}
                  </Badge>
                  <Badge tone="neutral">{source.strategy}</Badge>
                </div>
                <Text size="caption" tone="tertiary">
                  {source.domain} · {t("every {n} min", { n: Math.round(source.intervalSec / 60) })}
                  {source.failCount > 0
                    ? ` · ${t("{n} consecutive failures", { n: source.failCount })}`
                    : ""}
                </Text>
                <Text size="caption" tone="tertiary">
                  {t("Last OK")}: {formatAt(source.lastOkAt)}
                </Text>
                {source.lastError ? (
                  <Text size="caption" tone="danger">
                    {source.lastError}
                  </Text>
                ) : null}
              </div>
              <div className={styles.cardActions}>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyId === source.id}
                  onClick={() => void mutate(source.id, { enabled: !source.enabled })}
                >
                  {source.enabled ? t("Disable") : t("Enable")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busyId === source.id}
                  onClick={() => void forceCrawl(source.id)}
                >
                  {t("Crawl now")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.sectionHead}>
        <div>
          <Heading level={2} size="section">
            {t("Proposed sources")}
          </Heading>
          <Text size="caption" tone="tertiary">
            {t(
              "Domains the crawler found in outbound links. They stay inert until you approve them.",
            )}
          </Text>
        </div>
      </div>

      {proposals.length === 0 ? (
        <EmptyState title={t("No proposals waiting.")} />
      ) : (
        <ul className={styles.list}>
          {proposals.map((proposal) => (
            <li key={proposal.id} className={styles.card}>
              <div className={styles.cardMain}>
                <span className={styles.cardTitle}>{proposal.name}</span>
                <Text size="caption" tone="tertiary">
                  {proposal.domain} · {formatAt(proposal.createdAt)}
                </Text>
                {proposal.reason ? (
                  <Text size="caption" tone="secondary">
                    {proposal.reason}
                  </Text>
                ) : null}
              </div>
              <div className={styles.cardActions}>
                <Button
                  size="sm"
                  loading={busyId === proposal.id}
                  onClick={() => void reviewProposal(proposal.id, "approve")}
                >
                  {t("Approve")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyId === proposal.id}
                  onClick={() => void reviewProposal(proposal.id, "reject")}
                >
                  {t("Reject")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}

// ── Exams ───────────────────────────────────────────────────────────────────

export function AdminExamsPage() {
  const t = useT();
  const formatAt = useFormatAt();
  const [exams, setExams] = useState<AdminExam[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api<{ items: AdminExam[] }>("/admin/exams");
      setExams(res.items);
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBooting(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(
    () => (filter === "all" ? exams : exams.filter((e) => e.status === filter)),
    [exams, filter],
  );

  async function setStatus(id: string, status: "open" | "closed") {
    setBusyId(id);
    setError("");
    try {
      await api(`/admin/exams/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBusyId(null);
    }
  }

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={4}>
      <div className={styles.sectionHead}>
        <div>
          <Heading level={2} size="section">
            {t("Discovered exams")}
          </Heading>
          <Text size="caption" tone="tertiary">
            {t("Everything Ingestion has found. Close an exam the crawler cannot tell is over.")}
          </Text>
        </div>
        <SegmentedControl
          ariaLabel={t("Filter exams by status")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("All") },
            { value: "open", label: t("Open") },
            { value: "closed", label: t("Closed") },
          ]}
        />
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {exams.length === 0 ? (
        <EmptyState
          title={t("No exams discovered yet.")}
          description={t("Add a source and run a crawl; discovered exams appear here.")}
        />
      ) : rows.length === 0 ? (
        <EmptyState title={t("No exams match this filter.")} />
      ) : (
        <ul className={styles.list}>
          {rows.map((exam) => (
            <li key={exam.id} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.cardTitleRow}>
                  <span className={styles.cardTitle}>{exam.title}</span>
                  <Badge tone={exam.status === "open" ? "success" : "neutral"}>
                    {statusLabel(exam.status, t)}
                  </Badge>
                </div>
                <Text size="caption" tone="tertiary">
                  {[exam.org, exam.banca, exam.sourceDomain].filter(Boolean).join(" · ")}
                </Text>
                <Text size="caption" tone="tertiary">
                  {t("{n} artifact(s)", { n: exam.artifactCount })} ·{" "}
                  {t("Last seen")}: {formatAt(exam.lastSeenAt)}
                </Text>
                <a className={styles.link} href={exam.listingUrl} target="_blank" rel="noreferrer">
                  {t("Open listing")}
                </a>
              </div>
              <div className={styles.cardActions}>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyId === exam.id}
                  onClick={() => void setStatus(exam.id, exam.status === "open" ? "closed" : "open")}
                >
                  {exam.status === "open" ? t("Mark closed") : t("Mark open")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  );
}

// ── Quality queue (HITL) ────────────────────────────────────────────────────

export function AdminQualityPage() {
  const t = useT();
  const formatAt = useFormatAt();
  const [items, setItems] = useState<QualityItem[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [status, setStatus] = useState<"all" | "failed" | "needs_review">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const query = status === "all" ? "" : `?status=${status}`;
      const res = await api<{ items: QualityItem[] }>(`/admin/quality/queue${query}`);
      setItems(res.items);
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBooting(false);
    }
  }, [status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: "published" | "failed" | "requeue") {
    setBusyId(id);
    setError("");
    try {
      if (action === "requeue") {
        await api(`/admin/quality/queue/${id}/requeue`, { method: "POST" });
      } else {
        await api(`/admin/quality/queue/${id}`, {
          method: "POST",
          body: JSON.stringify({ decision: action }),
        });
      }
      await load();
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBusyId(null);
    }
  }

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={4}>
      <div className={styles.sectionHead}>
        <div>
          <Heading level={2} size="section">
            {t("Quality queue")}
          </Heading>
          <Text size="caption" tone="tertiary">
            {t(
              "Questions the publish gate rejected or could not decide. Publishing here overrides the automated verdict.",
            )}
          </Text>
        </div>
        <SegmentedControl
          ariaLabel={t("Filter by verdict")}
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: t("All") },
            { value: "needs_review", label: t("Needs review") },
            { value: "failed", label: t("Failed") },
          ]}
        />
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title={t("Nothing waiting for review.")}
          description={t(
            "Items land here only when structural validation or the LLM judge rejects them.",
          )}
        />
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <li key={item.id} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardTitleRow}>
                    <Badge tone={item.status === "failed" ? "danger" : "warning"}>
                      {statusLabel(item.status, t)}
                    </Badge>
                    <Badge tone="neutral">{item.examSlug}</Badge>
                    {item.qualityScore != null ? (
                      <Badge tone="neutral">
                        {t("score")} {item.qualityScore.toFixed(2)}
                      </Badge>
                    ) : null}
                  </div>
                  <p className={styles.prompt}>{item.prompt}</p>
                  {item.failReasons.length > 0 ? (
                    <Text size="caption" tone="danger">
                      {item.failReasons.join(" · ")}
                    </Text>
                  ) : null}
                  {item.qualityNotes ? (
                    <Text size="caption" tone="secondary">
                      {item.qualityNotes}
                    </Text>
                  ) : null}
                  <button
                    type="button"
                    className={styles.disclosure}
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                  >
                    {expanded ? t("Hide details") : t("Show details")}
                  </button>

                  {expanded ? (
                    <div className={styles.details}>
                      {item.options && item.options.length > 0 ? (
                        <ol className={styles.options}>
                          {item.options.map((option, index) => (
                            <li
                              key={`${item.id}-${index}`}
                              className={index === item.correctIndex ? styles.optionCorrect : ""}
                            >
                              {option}
                              {index === item.correctIndex ? ` — ${t("keyed correct")}` : ""}
                            </li>
                          ))}
                        </ol>
                      ) : null}
                      {item.explanation ? (
                        <Text size="caption" tone="secondary">
                          {item.explanation}
                        </Text>
                      ) : null}
                      {item.sourceUrl ? (
                        <a
                          className={styles.link}
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("Open source document")}
                        </a>
                      ) : null}
                      {item.reviews.length > 0 ? (
                        <ul className={styles.reviews}>
                          {item.reviews.map((review, index) => (
                            <li key={`${item.id}-review-${index}`}>
                              <Text size="caption" tone="tertiary">
                                {review.stage} → {review.decision} ({review.score.toFixed(2)}) ·{" "}
                                {formatAt(review.createdAt)}
                              </Text>
                              {review.notes ? (
                                <Text size="caption" tone="secondary">
                                  {review.notes}
                                </Text>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className={styles.cardActions}>
                  <Button
                    size="sm"
                    loading={busyId === item.id}
                    onClick={() => void act(item.id, "published")}
                  >
                    {t("Publish anyway")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={busyId === item.id}
                    onClick={() => void act(item.id, "requeue")}
                  >
                    {t("Re-run eval")}
                  </Button>
                  {item.status !== "failed" ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={busyId === item.id}
                      onClick={() => void act(item.id, "failed")}
                    >
                      {t("Reject")}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Stack>
  );
}

// ── Pipeline health ─────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.stat}>
      <span className={[styles.statValue, "qz-tabular"].join(" ")}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

export function AdminHealthPage() {
  const t = useT();
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setHealth(await api<PipelineHealth>("/admin/health/pipeline"));
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBooting(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (booting) return <PageSkeleton />;

  const discovery = health?.discovery;
  const content = health?.content;
  const discoveryDown = !discovery || "error" in discovery;
  const contentDown = !content || "error" in content;

  return (
    <Stack gap={5}>
      <div className={styles.sectionHead}>
        <div>
          <Heading level={2} size="section">
            {t("Pipeline health")}
          </Heading>
          <Text size="caption" tone="tertiary">
            {t("Live counters from the Discovery and Content stacks.")}
          </Text>
        </div>
        <Button size="sm" variant="secondary" onClick={() => void load()}>
          {t("Refresh")}
        </Button>
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      <section>
        <Heading level={3} size="section">
          {t("Ingestion")}
        </Heading>
        {discoveryDown ? (
          <EmptyState
            title={t("Discovery stack unreachable.")}
            description={discovery && "error" in discovery ? discovery.error : undefined}
          />
        ) : (
          <div className={styles.stats}>
            <Stat label={t("Sources")} value={discovery.sources?.total ?? 0} />
            <Stat label={t("Active")} value={discovery.sources?.active ?? 0} />
            <Stat label={t("Broken")} value={discovery.sources?.broken ?? 0} />
            <Stat label={t("Proposals")} value={discovery.sources?.proposed ?? 0} />
            <Stat label={t("Open exams")} value={discovery.openExams ?? 0} />
            <Stat label={t("Artifacts")} value={discovery.artifacts ?? 0} />
          </div>
        )}
      </section>

      <section>
        <Heading level={3} size="section">
          {t("Extraction and Generation")}
        </Heading>
        {contentDown ? (
          <EmptyState
            title={t("Content stack unreachable.")}
            description={content && "error" in content ? content.error : undefined}
          />
        ) : (
          <>
            <div className={styles.stats}>
              <Stat label={t("Docs pending")} value={content.documents?.pending ?? 0} />
              <Stat label={t("Docs extracted")} value={content.documents?.extracted ?? 0} />
              <Stat label={t("Docs failed")} value={content.documents?.failed ?? 0} />
              <Stat label={t("Chunks")} value={content.chunks?.total ?? 0} />
              <Stat label={t("Embedded")} value={content.chunks?.embedded ?? 0} />
            </div>
            <Heading level={3} size="section">
              {t("Question bank")}
            </Heading>
            <div className={styles.stats}>
              <Stat label={t("Draft")} value={content.questionItems?.draft ?? 0} />
              <Stat label={t("Needs review")} value={content.questionItems?.needsReview ?? 0} />
              <Stat label={t("Published")} value={content.questionItems?.published ?? 0} />
              <Stat label={t("Failed")} value={content.questionItems?.failed ?? 0} />
            </div>
            {content.lastGenerationRun ? (
              <Text size="caption" tone="tertiary">
                {t("Last generation run")}: {content.lastGenerationRun.status} ·{" "}
                {t("{n} drafted", { n: content.lastGenerationRun.drafted })}
                {content.lastGenerationRun.error ? ` · ${content.lastGenerationRun.error}` : ""}
              </Text>
            ) : (
              <Text size="caption" tone="tertiary">
                {t("No generation run yet.")}
              </Text>
            )}
          </>
        )}
      </section>
    </Stack>
  );
}
