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
  kind?: string;
  discoveryMode?: string;
  allowedRoles?: string[];
  authorityScore?: number | null;
  licenseNote?: string | null;
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

interface PipelineMetrics {
  syllabusMappedShare: number | null;
  adminRejectShare: number | null;
  publishedCount: number;
  reviewedWindowCount: number;
  failedMetadataCount: number;
  publishRate?: number | null;
  tokensPerPublished?: number | null;
  stageBuckets?: Array<{
    stage: string;
    decision: string;
    reason: string;
    count: number;
  }>;
  reasonHistogram?: Array<{ reason: string; count: number }>;
}

interface TopicQueryRow {
  id: string;
  examId: string;
  syllabusNodeId: string;
  canonicalKey: string;
  queries: unknown;
  status: string;
  candidatesFound: number;
  candidatesStored: number;
  createdAt: string;
  finishedAt: string | null;
}

interface ContentDocumentRow {
  id: string;
  examSlug: string;
  kind: string;
  role: string;
  roleConfidence: number | null;
  roleMethod: string | null;
  rank: number | null;
  status: string;
  sectionCount?: number;
  chunkCount: number;
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
  const [kind, setKind] = useState("banca_portal");
  const [discoveryMode, setDiscoveryMode] = useState("listing");
  const [allowedRoles, setAllowedRoles] = useState("specification,evidence,knowledge");
  const [authorityScore, setAuthorityScore] = useState("");
  const [licenseNote, setLicenseNote] = useState("");

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
          kind: kind.trim() || undefined,
          discoveryMode: discoveryMode.trim() || undefined,
          allowedRoles: lines(allowedRoles.replace(/,/g, "\n")),
          authorityScore: authorityScore.trim() ? Number(authorityScore) : undefined,
          licenseNote: licenseNote.trim() || undefined,
        }),
      });
      setName("");
      setStartUrls("");
      setLinkPatterns("");
      setOpenPatterns("");
      setKind("banca_portal");
      setDiscoveryMode("listing");
      setAllowedRoles("specification,evidence,knowledge");
      setAuthorityScore("");
      setLicenseNote("");
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
          <Field label={t("Kind")} hint={t("banca_portal, legislation, educational_site, …")}>
            <Input value={kind} onChange={(e) => setKind(e.target.value)} />
          </Field>
          <Field label={t("Discovery mode")} hint={t("listing | topic | direct")}>
            <Input value={discoveryMode} onChange={(e) => setDiscoveryMode(e.target.value)} />
          </Field>
          <Field
            label={t("Allowed roles")}
            hint={t("Comma or newline separated DocumentRole values.")}
          >
            <Input value={allowedRoles} onChange={(e) => setAllowedRoles(e.target.value)} />
          </Field>
          <Field label={t("Authority score (0–1)")}>
            <Input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={authorityScore}
              placeholder="0.9"
              onChange={(e) => setAuthorityScore(e.target.value)}
            />
          </Field>
          <Field label={t("License note")}>
            <Input
              value={licenseNote}
              placeholder={t("e.g. official gazette; reuse OK")}
              onChange={(e) => setLicenseNote(e.target.value)}
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
                  {source.kind ? <Badge tone="neutral">{source.kind}</Badge> : null}
                  {source.discoveryMode ? (
                    <Badge tone="neutral">{source.discoveryMode}</Badge>
                  ) : null}
                </div>
                <Text size="caption" tone="tertiary">
                  {source.domain} · {t("every {n} min", { n: Math.round(source.intervalSec / 60) })}
                  {source.authorityScore != null
                    ? ` · auth ${source.authorityScore}`
                    : ""}
                  {source.failCount > 0
                    ? ` · ${t("{n} consecutive failures", { n: source.failCount })}`
                    : ""}
                </Text>
                {source.allowedRoles && source.allowedRoles.length > 0 ? (
                  <Text size="caption" tone="tertiary">
                    {t("Roles")}: {source.allowedRoles.join(", ")}
                  </Text>
                ) : null}
                {source.licenseNote ? (
                  <Text size="caption" tone="tertiary">
                    {source.licenseNote}
                  </Text>
                ) : null}
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
  const [coverageBySlug, setCoverageBySlug] = useState<
    Record<
      string,
      {
        nodeCount: number;
        leavesWithKu: number;
        published: number;
        status?: string;
        tree?: Array<{ id: string; depth: number; title: string; rawText: string }>;
        rawSections?: Array<{
          sectionId: string;
          heading: string | null;
          role: string;
          textPreview: string;
        }>;
      } | null
    >
  >({});

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

  async function loadCoverage(examSlug: string) {
    setBusyId(examSlug);
    setError("");
    try {
      const data = await api<{
        syllabus: { nodeCount: number; status?: string } | null;
        coverage: Array<{ kus: number; published: number }>;
        tree?: Array<{ id: string; depth: number; title: string; rawText: string }>;
        rawSections?: Array<{
          sectionId: string;
          heading: string | null;
          role: string;
          textPreview: string;
        }>;
      }>(`/admin/content/exams/${encodeURIComponent(examSlug)}/coverage`);
      const coverage = data.coverage ?? [];
      setCoverageBySlug((prev) => ({
        ...prev,
        [examSlug]: data.syllabus
          ? {
              nodeCount: data.syllabus.nodeCount,
              leavesWithKu: coverage.filter((c) => c.kus > 0).length,
              published: coverage.reduce((sum, c) => sum + c.published, 0),
              status: data.syllabus.status,
              tree: data.tree ?? [],
              rawSections: data.rawSections ?? [],
            }
          : null,
      }));
    } catch (err) {
      setError(errText(err, t));
      setCoverageBySlug((prev) => ({ ...prev, [examSlug]: null }));
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
                {coverageBySlug[exam.examSlug] !== undefined ? (
                  <>
                    <Text size="caption" tone="tertiary">
                      {coverageBySlug[exam.examSlug] == null
                        ? t("No active syllabus.")
                        : t("{nodes} nodes · {kus} leaves with KUs · {pub} published", {
                            nodes: coverageBySlug[exam.examSlug]!.nodeCount,
                            kus: coverageBySlug[exam.examSlug]!.leavesWithKu,
                            pub: coverageBySlug[exam.examSlug]!.published,
                          })}
                      {coverageBySlug[exam.examSlug]?.status
                        ? ` · ${coverageBySlug[exam.examSlug]!.status}`
                        : ""}
                    </Text>
                    {coverageBySlug[exam.examSlug]?.tree &&
                    coverageBySlug[exam.examSlug]!.tree!.length > 0 ? (
                      <ul className={styles.list}>
                        {coverageBySlug[exam.examSlug]!.tree!.slice(0, 40).map((n) => (
                          <li key={n.id}>
                            <Text size="caption" tone="tertiary">
                              {"··".repeat(Math.max(0, n.depth))} {n.title}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {coverageBySlug[exam.examSlug]?.status === "needs_review" &&
                    (coverageBySlug[exam.examSlug]!.rawSections?.length ?? 0) > 0 ? (
                      <div>
                        <Text size="caption" tone="tertiary">
                          {t("Raw sections (needs review)")}
                        </Text>
                        <ul className={styles.list}>
                          {coverageBySlug[exam.examSlug]!.rawSections!.slice(0, 12).map((s) => (
                            <li key={s.sectionId} className={styles.card}>
                              <Text size="caption" tone="tertiary">
                                [{s.role}] {s.heading || t("(no heading)")}
                              </Text>
                              <Text size="caption" tone="tertiary">
                                {s.textPreview.slice(0, 240)}
                              </Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
              <div className={styles.cardActions}>
                <Button
                  size="sm"
                  variant="ghost"
                  loading={busyId === exam.examSlug}
                  onClick={() => void loadCoverage(exam.examSlug)}
                >
                {t("Coverage / syllabus")}
              </Button>
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
  const [provenanceById, setProvenanceById] = useState<Record<string, unknown>>({});

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

  async function loadProvenance(id: string) {
    setBusyId(id);
    setError("");
    try {
      const data = await api<unknown>(`/admin/content/question-items/${id}/provenance`);
      setProvenanceById((prev) => ({ ...prev, [id]: data }));
      setExpandedId(id);
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
                      {provenanceById[item.id] ? (
                        <ProvenanceTree data={provenanceById[item.id]} t={t} />
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
                    variant="ghost"
                    onClick={() => void loadProvenance(item.id)}
                  >
                    {t("Provenance")}
                  </Button>
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

function ProvenanceTree({ data, t }: { data: unknown; t: Translate }) {
  if (!data || typeof data !== "object") {
    return (
      <pre className={styles.reviews}>{JSON.stringify(data, null, 2)}</pre>
    );
  }
  const p = data as {
    questionItem?: {
      id?: string;
      examSlug?: string;
      origin?: string;
      status?: string;
      previousQuestionId?: string | null;
    };
    syllabusNode?: {
      title?: string;
      pathSlug?: string;
      path?: Array<{ title?: string; pathSlug?: string }>;
    } | null;
    knowledgeUnits?: Array<{
      id: string;
      statement: string;
      evidence?: Array<{ sourceUrl?: string | null; span?: [number, number] | null }>;
    }>;
    chain?: {
      chunks?: Array<{ id: string; textPreview?: string; sectionRole?: string | null }>;
      sections?: Array<{ id: string; role?: string; heading?: string | null }>;
      documents?: Array<{
        id: string;
        role?: string;
        sourceUrl?: string | null;
        purpose?: string;
        discoveryArtifactId?: string | null;
      }>;
      artifacts?: Array<{
        discoveryArtifactId: string;
        artifact?: { url?: string | null; kind?: string; kindHint?: string };
        source?: { id?: string; domain?: string; name?: string; kind?: string } | null;
        topicQuery?: {
          id?: string;
          canonicalKey?: string;
          status?: string;
          candidatesStored?: number;
        } | null;
      }>;
    };
    previousQuestion?: {
      id?: string;
      prompt?: string;
      year?: number | null;
      number?: number;
      document?: { id?: string; sourceUrl?: string | null; role?: string } | null;
    } | null;
    styleProfile?: unknown;
    generationRun?: {
      id?: string;
      promptVersion?: string;
      model?: string | null;
      tokensIn?: number | null;
      tokensOut?: number | null;
    } | null;
    reviews?: Array<{ id?: string; stage?: string; decision?: string }>;
  };

  const pathLabel =
    (p.syllabusNode?.path ?? [])
      .map((n) => n.title)
      .filter(Boolean)
      .join(" › ") || p.syllabusNode?.title;

  return (
    <div className={styles.details}>
      <Text size="caption" tone="secondary">
        {t("Provenance chain")}
      </Text>
      <ul className={styles.reviews}>
        <li>
          <details open>
            <summary>
              <Text size="caption" tone="tertiary">
                Q · {p.questionItem?.examSlug ?? "—"} · {p.questionItem?.origin ?? "—"} ·{" "}
                {p.questionItem?.status ?? "—"}
              </Text>
            </summary>
          </details>
        </li>
        {p.syllabusNode ? (
          <li>
            <details open>
              <summary>
                <Text size="caption" tone="tertiary">
                  Syllabus · {pathLabel} ({p.syllabusNode.pathSlug})
                </Text>
              </summary>
            </details>
          </li>
        ) : null}
        {(p.knowledgeUnits ?? []).length > 0 ? (
          <li>
            <details open>
              <summary>
                <Text size="caption" tone="tertiary">
                  KnowledgeUnits · {(p.knowledgeUnits ?? []).length}
                </Text>
              </summary>
              <ul className={styles.reviews}>
                {(p.knowledgeUnits ?? []).map((ku) => (
                  <li key={ku.id}>
                    <Text size="caption" tone="tertiary">
                      KU · {ku.statement.slice(0, 120)}
                      {ku.statement.length > 120 ? "…" : ""}
                      {(ku.evidence ?? [])
                        .map((ev) =>
                          ev.sourceUrl
                            ? ` · ${ev.sourceUrl}${ev.span ? ` [${ev.span[0]}-${ev.span[1]}]` : ""}`
                            : "",
                        )
                        .join("")}
                    </Text>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ) : null}
        {(p.chain?.chunks ?? []).length > 0 ? (
          <li>
            <details>
              <summary>
                <Text size="caption" tone="tertiary">
                  Chunks · {(p.chain?.chunks ?? []).length}
                </Text>
              </summary>
              <ul className={styles.reviews}>
                {(p.chain?.chunks ?? []).map((c) => (
                  <li key={c.id}>
                    <Text size="caption" tone="tertiary">
                      Chunk · {c.sectionRole ?? "?"} · {(c.textPreview ?? "").slice(0, 100)}
                    </Text>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ) : null}
        {(p.chain?.documents ?? []).length > 0 ? (
          <li>
            <details open>
              <summary>
                <Text size="caption" tone="tertiary">
                  Documents · {(p.chain?.documents ?? []).length}
                </Text>
              </summary>
              <ul className={styles.reviews}>
                {(p.chain?.documents ?? []).map((d) => (
                  <li key={`${d.id}-${d.purpose ?? "doc"}`}>
                    <Text size="caption" tone="tertiary">
                      Doc · {d.role}
                      {d.purpose ? ` (${d.purpose})` : ""}
                      {d.sourceUrl ? ` · ${d.sourceUrl}` : ""}
                      {d.discoveryArtifactId ? ` · artifact=${d.discoveryArtifactId}` : ""}
                    </Text>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ) : null}
        {(p.chain?.artifacts ?? []).length > 0 ? (
          <li>
            <details open>
              <summary>
                <Text size="caption" tone="tertiary">
                  Artifact → Source / TopicQuery · {(p.chain?.artifacts ?? []).length}
                </Text>
              </summary>
              <ul className={styles.reviews}>
                {(p.chain?.artifacts ?? []).map((a) => (
                  <li key={a.discoveryArtifactId}>
                    <Text size="caption" tone="tertiary">
                      Artifact · {a.artifact?.kind ?? "?"} / {a.artifact?.kindHint ?? "?"}
                      {a.artifact?.url ? ` · ${a.artifact.url}` : ""}
                    </Text>
                    {a.source ? (
                      <div>
                        <Text size="caption" tone="tertiary">
                          Source · {a.source.name} ({a.source.domain}) · {a.source.kind}
                        </Text>
                      </div>
                    ) : null}
                    {a.topicQuery ? (
                      <div>
                        <Text size="caption" tone="tertiary">
                          TopicQuery · {a.topicQuery.canonicalKey} · {a.topicQuery.status} · stored=
                          {a.topicQuery.candidatesStored ?? 0}
                        </Text>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ) : null}
        {p.previousQuestion ? (
          <li>
            <details open>
              <summary>
                <Text size="caption" tone="tertiary">
                  PreviousQuestion · #{p.previousQuestion.number ?? "?"}{" "}
                  {p.previousQuestion.year ?? ""}
                </Text>
              </summary>
              <Text size="caption" tone="tertiary">
                {(p.previousQuestion.prompt ?? "").slice(0, 160)}
                {p.previousQuestion.document?.sourceUrl
                  ? ` · ${p.previousQuestion.document.sourceUrl}`
                  : ""}
              </Text>
            </details>
          </li>
        ) : null}
        {p.generationRun ? (
          <li>
            <details open>
              <summary>
                <Text size="caption" tone="tertiary">
                  Run · {p.generationRun.promptVersion} · {p.generationRun.model ?? "—"}
                  {p.generationRun.tokensIn != null || p.generationRun.tokensOut != null
                    ? ` · tokens ${p.generationRun.tokensIn ?? 0}/${p.generationRun.tokensOut ?? 0}`
                    : ""}
                </Text>
              </summary>
              {p.styleProfile ? (
                <pre className={styles.reviews}>
                  {JSON.stringify(p.styleProfile, null, 2).slice(0, 800)}
                </pre>
              ) : null}
            </details>
          </li>
        ) : null}
        {(p.reviews ?? []).length > 0 ? (
          <li>
            <details>
              <summary>
                <Text size="caption" tone="tertiary">
                  Reviews · {(p.reviews ?? []).length}
                </Text>
              </summary>
              <ul className={styles.reviews}>
                {(p.reviews ?? []).map((r, idx) => (
                  <li key={r.id ?? String(idx)}>
                    <Text size="caption" tone="tertiary">
                      {r.stage ?? "?"} · {r.decision ?? "?"}
                    </Text>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ) : null}
      </ul>
      <details>
        <summary>
          <Text size="caption" tone="tertiary">
            {t("Raw JSON")}
          </Text>
        </summary>
        <pre className={styles.reviews}>{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
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
  const formatAt = useFormatAt();
  const [health, setHealth] = useState<PipelineHealth | null>(null);
  const [metrics, setMetrics] = useState<PipelineMetrics | null>(null);
  const [topicQueries, setTopicQueries] = useState<TopicQueryRow[]>([]);
  const [documents, setDocuments] = useState<ContentDocumentRow[]>([]);
  const [docDetail, setDocDetail] = useState<{
    document: ContentDocumentRow & { stats?: unknown; sourceUrl?: string | null };
    sections: Array<{ id: string; heading: string | null; role: string; scores: unknown }>;
  } | null>(null);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [h, m, tq, docs] = await Promise.all([
        api<PipelineHealth>("/admin/health/pipeline"),
        api<PipelineMetrics>("/admin/content/metrics/pipeline").catch(() => null),
        api<{ items: TopicQueryRow[] }>("/admin/topic-queries?limit=30").catch(() => ({
          items: [] as TopicQueryRow[],
        })),
        api<{ items: ContentDocumentRow[] }>("/admin/content/documents?limit=25").catch(() => ({
          items: [] as ContentDocumentRow[],
        })),
      ]);
      setHealth(h);
      setMetrics(m);
      setTopicQueries(tq.items);
      setDocuments(docs.items);
    } catch (err) {
      setError(errText(err, t));
    } finally {
      setBooting(false);
    }
  }, [t]);

  async function loadDocument(id: string) {
    setError("");
    try {
      const data = await api<{
        document: ContentDocumentRow & { stats?: unknown; sourceUrl?: string | null };
        sections: Array<{ id: string; heading: string | null; role: string; scores: unknown }>;
      }>(`/admin/content/documents/${encodeURIComponent(id)}`);
      setDocDetail(data);
    } catch (err) {
      setError(errText(err, t));
    }
  }

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

      <section>
        <Heading level={3} size="section">
          {t("Eval metrics (24h)")}
        </Heading>
        {metrics ? (
          <div className={styles.stats}>
            <Stat
              label={t("Syllabus mapped")}
              value={
                metrics.syllabusMappedShare == null
                  ? "—"
                  : `${Math.round(metrics.syllabusMappedShare * 100)}%`
              }
            />
            <Stat
              label={t("Admin reject share")}
              value={
                metrics.adminRejectShare == null
                  ? "—"
                  : `${Math.round(metrics.adminRejectShare * 100)}%`
              }
            />
            <Stat label={t("Published")} value={metrics.publishedCount} />
            <Stat label={t("Metadata fails")} value={metrics.failedMetadataCount} />
            <Stat
              label={t("Publish rate")}
              value={
                metrics.publishRate == null
                  ? "—"
                  : `${Math.round(metrics.publishRate * 100)}%`
              }
            />
            <Stat
              label={t("Tokens / published")}
              value={
                metrics.tokensPerPublished == null
                  ? "—"
                  : Math.round(metrics.tokensPerPublished)
              }
            />
          </div>
        ) : (
          <Text size="caption" tone="tertiary">
            {t("Pipeline metrics unavailable.")}
          </Text>
        )}
      </section>

      <section>
        <Heading level={3} size="section">
          {t("Stage funnel (24h)")}
        </Heading>
        {metrics?.stageBuckets && metrics.stageBuckets.length > 0 ? (
          <ul className={styles.list}>
            {metrics.stageBuckets.slice(0, 40).map((b, i) => (
              <li key={`${b.stage}-${b.decision}-${b.reason}-${i}`} className={styles.card}>
                <Text size="caption" tone="tertiary">
                  {b.stage} · {b.decision} · {b.reason || "—"} · ×{b.count}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="caption" tone="tertiary">
            {t("No stage metrics yet.")}
          </Text>
        )}
      </section>

      <section>
        <Heading level={3} size="section">
          {t("Rejection reasons (24h)")}
        </Heading>
        {metrics?.reasonHistogram && metrics.reasonHistogram.length > 0 ? (
          <ul className={styles.list}>
            {metrics.reasonHistogram.map((r) => (
              <li key={r.reason} className={styles.card}>
                <Text size="caption" tone="tertiary">
                  {r.reason} · ×{r.count}
                </Text>
              </li>
            ))}
          </ul>
        ) : (
          <Text size="caption" tone="tertiary">
            {t("No rejection reasons in the window.")}
          </Text>
        )}
      </section>

      <section>
        <Heading level={3} size="section">
          {t("Documents (roles)")}
        </Heading>
        {documents.length === 0 ? (
          <Text size="caption" tone="tertiary">
            {t("No content documents yet.")}
          </Text>
        ) : (
          <ul className={styles.list}>
            {documents.map((d) => (
              <li key={d.id} className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <Badge tone="neutral">{d.role}</Badge>
                  <Badge tone="neutral">{d.kind}</Badge>
                  <Badge tone="neutral">{d.examSlug}</Badge>
                </div>
                <Text size="caption" tone="tertiary">
                  {d.roleMethod ?? "—"}
                  {d.roleConfidence != null ? ` · conf ${d.roleConfidence.toFixed(2)}` : ""}
                  {d.rank != null ? ` · rank ${d.rank.toFixed(2)}` : ""}
                  {` · ${d.sectionCount ?? 0} sections · ${d.chunkCount} chunks`}
                </Text>
                <Button size="sm" variant="ghost" onClick={() => void loadDocument(d.id)}>
                  {t("Sections")}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {docDetail ? (
          <div className={styles.details}>
            <Text size="caption" tone="secondary">
              {docDetail.document.examSlug} · {docDetail.document.role} ·{" "}
              {docDetail.sections.length} sections
            </Text>
            <ul className={styles.reviews}>
              {docDetail.sections.slice(0, 40).map((s) => (
                <li key={s.id}>
                  <Text size="caption" tone="tertiary">
                    {s.role} · {s.heading ?? "—"}
                  </Text>
                </li>
              ))}
            </ul>
            {docDetail.document.stats ? (
              <details>
                <summary>
                  <Text size="caption" tone="tertiary">
                    {t("Stats JSON")}
                  </Text>
                </summary>
                <pre className={styles.reviews}>
                  {JSON.stringify(docDetail.document.stats, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        ) : null}
      </section>

      <section>
        <Heading level={3} size="section">
          {t("Topic queries")}
        </Heading>
        {topicQueries.length === 0 ? (
          <Text size="caption" tone="tertiary">
            {t("No topic queries recorded.")}
          </Text>
        ) : (
          <ul className={styles.list}>
            {topicQueries.map((row) => (
              <li key={row.id} className={styles.card}>
                <div className={styles.cardTitleRow}>
                  <Badge tone={row.status === "done" ? "success" : "neutral"}>{row.status}</Badge>
                  <Badge tone="neutral">{row.canonicalKey}</Badge>
                </div>
                <Text size="caption" tone="tertiary">
                  found {row.candidatesFound} · stored {row.candidatesStored} ·{" "}
                  {formatAt(row.finishedAt ?? row.createdAt)}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Stack>
  );
}
