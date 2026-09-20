// Concept: HITL — per-exam file triage.
//
// Every file the crawler attached to an exam, side by side with what the
// content pipeline did to it (classifier verdict, extraction status, and the
// per-stage outcome: syllabus / evidence / knowledge). Files the classifier
// could not place are the human's to label — with closed enums only, because
// the label is what the pipeline consumes.
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useT, type Translate } from "../../i18n";
import { Badge, Button, EmptyState, SegmentedControl, Spinner, Text, type BadgeTone } from "../../ui";
import styles from "./Admin.module.css";

// ── Closed label vocabularies (mirror content-api enums) ────────────────────

export const DOCUMENT_ROLE_OPTIONS = ["specification", "evidence", "knowledge", "administrative"] as const;
export const DOCUMENT_KIND_OPTIONS = ["edital", "prova", "gabarito", "programa", "other"] as const;
type RoleOption = (typeof DOCUMENT_ROLE_OPTIONS)[number];
type KindOption = (typeof DOCUMENT_KIND_OPTIONS)[number];

const LOW_CONFIDENCE = 0.55;
const MAX_AUTO_ATTEMPTS = 3;
const ADMIN_ROLE_METHOD = "admin_override";

// ── Wire types (mirror apps/api GET /admin/exams/:id/files) ─────────────────

interface FileArtifact {
  id: string;
  kind: string;
  kindHint: string;
  roleHint: string;
  anchorLabel: string | null;
  url: string | null;
  contentType: string | null;
  byteSize: number | null;
  stored: boolean;
  bytesPurgedAt: string | null;
  imported: boolean;
  fetchedAt: string;
}

interface StageOutcome {
  v?: number;
  role?: string;
  syllabus?: { nodes: number; status: string } | { skipped: string };
  evidence?: { previousQuestions: number; gabaritoPaired?: boolean } | { skipped: string };
  knowledge?:
    | { chunks: number; eligible: number; parked: number; ineligible: number; units: number; leaves: number }
    | { skipped: string };
  triage?: { attempts: number; lastAt: string; lastResult: string };
  pruned?: { reason: string; at: string };
}

interface FileDocument {
  id: string;
  kind: string;
  role: string;
  roleConfidence: number | null;
  roleMethod: string | null;
  subtype: string | null;
  status: "pending" | "extracting" | "extracted" | "failed";
  failReason: string | null;
  attempts: number;
  outcome: StageOutcome | null;
  sourceUrl: string | null;
  contentType: string | null;
  bytesPurgedAt: string | null;
  sectionCount: number;
  previousQuestions: number;
  chunks: Record<string, number>;
  knowledgeUnits: number;
  items: Record<string, number>;
}

interface FileRow {
  artifact: FileArtifact | null;
  document: FileDocument | null;
}

type Filter = "needs_label" | "all" | "failed" | "pruned" | "productive";

// ── Helpers ─────────────────────────────────────────────────────────────────

function isPruned(doc: FileDocument | null): boolean {
  return Boolean(doc?.failReason?.startsWith("pruned:") || doc?.outcome?.pruned);
}

/** The classifier gave up (or never decided) and no human has labelled it. */
export function needsLabel(doc: FileDocument | null): boolean {
  if (!doc || doc.roleMethod === ADMIN_ROLE_METHOD || isPruned(doc)) return false;
  if (doc.status !== "extracted") return false;
  if (doc.role === "unknown") return true;
  if ((doc.roleConfidence ?? 1) < LOW_CONFIDENCE) return true;
  return (doc.outcome?.triage?.attempts ?? 0) >= MAX_AUTO_ATTEMPTS && doc.role === "unknown";
}

function isProductive(doc: FileDocument | null): boolean {
  if (!doc) return false;
  const published = doc.items.published ?? 0;
  return (
    doc.previousQuestions > 0 ||
    doc.knowledgeUnits > 0 ||
    published > 0 ||
    ("nodes" in (doc.outcome?.syllabus ?? {}) && (doc.outcome!.syllabus as { nodes: number }).nodes > 0)
  );
}

function fileTitle(row: FileRow): string {
  const label = row.artifact?.anchorLabel?.trim();
  if (label) return label;
  const url = row.artifact?.url ?? row.document?.sourceUrl ?? "";
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : u.hostname;
  } catch {
    return url || "(no url)";
  }
}

function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function roleTone(role: string): BadgeTone {
  switch (role) {
    case "specification":
    case "evidence":
      return "accent";
    case "knowledge":
      return "success";
    case "administrative":
      return "neutral";
    default:
      return "warning";
  }
}

function statusTone(doc: FileDocument): BadgeTone {
  if (isPruned(doc)) return "neutral";
  if (doc.status === "failed") return "danger";
  if (doc.status === "extracted") return "success";
  return "warning";
}

function describeOutcome(doc: FileDocument, t: Translate): string[] {
  const o = doc.outcome;
  const lines: string[] = [];
  if (!o) return lines;
  if (o.pruned) lines.push(t("pruned: {reason}", { reason: o.pruned.reason }));
  if (o.syllabus) {
    lines.push(
      "skipped" in o.syllabus
        ? t("syllabus: skipped ({reason})", { reason: o.syllabus.skipped })
        : t("syllabus: {n} nodes ({status})", { n: o.syllabus.nodes, status: o.syllabus.status }),
    );
  }
  if (o.evidence) {
    lines.push(
      "skipped" in o.evidence
        ? t("evidence: skipped ({reason})", { reason: o.evidence.skipped })
        : t("evidence: {n} previous questions", { n: o.evidence.previousQuestions }),
    );
  }
  if (o.knowledge) {
    lines.push(
      "skipped" in o.knowledge
        ? t("knowledge: skipped ({reason})", { reason: o.knowledge.skipped })
        : t("knowledge: {chunks} chunks · {eligible} eligible · {parked} parked · {units} KUs", {
            chunks: o.knowledge.chunks,
            eligible: o.knowledge.eligible,
            parked: o.knowledge.parked,
            units: o.knowledge.units,
          }),
    );
  }
  if (o.triage) {
    lines.push(
      t("auto-classify: {n}/{max} tries, last {result}", {
        n: o.triage.attempts,
        max: MAX_AUTO_ATTEMPTS,
        result: o.triage.lastResult,
      }),
    );
  }
  return lines;
}

// ── Component ───────────────────────────────────────────────────────────────

export function ExamFilesPanel({ examId }: { examId: string }) {
  const t = useT();
  const [rows, setRows] = useState<FileRow[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("needs_label");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [relabelId, setRelabelId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await api<{ files: FileRow[] }>(`/admin/exams/${encodeURIComponent(examId)}/files`);
      setRows(res.files);
      // Default to the human's queue; fall back to everything when it is empty.
      if (!res.files.some((r) => needsLabel(r.document))) setFilter("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRows([]);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const all = rows ?? [];
    return {
      all: all.length,
      needs_label: all.filter((r) => needsLabel(r.document)).length,
      failed: all.filter((r) => r.document?.status === "failed" && !isPruned(r.document)).length,
      pruned: all.filter((r) => isPruned(r.document)).length,
      productive: all.filter((r) => isProductive(r.document)).length,
    };
  }, [rows]);

  const visible = useMemo(() => {
    const all = rows ?? [];
    switch (filter) {
      case "needs_label":
        return all.filter((r) => needsLabel(r.document));
      case "failed":
        return all.filter((r) => r.document?.status === "failed" && !isPruned(r.document));
      case "pruned":
        return all.filter((r) => isPruned(r.document));
      case "productive":
        return all.filter((r) => isProductive(r.document));
      default:
        return all;
    }
  }, [rows, filter]);

  async function label(documentId: string, role: RoleOption, kind: KindOption) {
    setBusyId(documentId);
    setError("");
    try {
      await api(`/admin/content/documents/${encodeURIComponent(documentId)}`, {
        method: "PATCH",
        body: JSON.stringify({ role, kind, reprocess: true }),
      });
      setRelabelId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  if (rows === null) return <Spinner />;

  return (
    <div className={styles.details}>
      <div className={styles.sectionHead}>
        <Text size="caption" tone="tertiary">
          {t("{n} file(s) · {needs} need a label · {failed} failed · {pruned} pruned · {productive} productive", {
            n: counts.all,
            needs: counts.needs_label,
            failed: counts.failed,
            pruned: counts.pruned,
            productive: counts.productive,
          })}
        </Text>
        <SegmentedControl
          ariaLabel={t("Filter files")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: "needs_label", label: t("Needs label") },
            { value: "all", label: t("All") },
            { value: "failed", label: t("Failed") },
            { value: "pruned", label: t("Pruned") },
            { value: "productive", label: t("Productive") },
          ]}
        />
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title={filter === "needs_label" ? t("Nothing waiting for a label.") : t("No files match this filter.")}
        />
      ) : (
        <ul className={styles.list}>
          {visible.map((row) => {
            const doc = row.document;
            const key = doc?.id ?? row.artifact?.id ?? "";
            const url = row.artifact?.url ?? doc?.sourceUrl ?? null;
            const showPicker = doc && (needsLabel(doc) || relabelId === doc.id);
            return (
              <li key={key} className={styles.card}>
                <div className={styles.cardMain}>
                  <div className={styles.cardTitleRow}>
                    {url ? (
                      <a className={styles.link} href={url} target="_blank" rel="noreferrer">
                        {fileTitle(row)}
                      </a>
                    ) : (
                      <span className={styles.cardTitle}>{fileTitle(row)}</span>
                    )}
                    {row.artifact ? (
                      <Badge tone="neutral">
                        {t("crawler")}: {row.artifact.kindHint}/{row.artifact.roleHint}
                      </Badge>
                    ) : null}
                    {doc ? (
                      <Badge tone={roleTone(doc.role)}>
                        {doc.role}
                        {doc.roleConfidence != null ? ` ${Math.round(doc.roleConfidence * 100)}%` : ""}
                        {doc.roleMethod ? ` · ${doc.roleMethod}` : ""}
                      </Badge>
                    ) : (
                      <Badge tone="warning">{row.artifact?.imported ? t("dropped at import") : t("not imported")}</Badge>
                    )}
                    {doc ? (
                      <Badge tone={statusTone(doc)}>{isPruned(doc) ? t("Pruned") : doc.status}</Badge>
                    ) : null}
                    {doc && doc.kind !== "other" ? <Badge tone="neutral">{doc.kind}</Badge> : null}
                  </div>
                  <Text size="caption" tone="tertiary">
                    {[
                      row.artifact?.contentType ?? doc?.contentType,
                      formatBytes(row.artifact?.byteSize),
                      row.artifact?.bytesPurgedAt || doc?.bytesPurgedAt ? t("bytes purged") : row.artifact?.stored ? t("bytes stored") : null,
                      doc ? t("{n} section(s)", { n: doc.sectionCount }) : null,
                      doc && (doc.items.published ?? 0) > 0 ? t("{n} published", { n: doc.items.published }) : null,
                      doc && (doc.items.needs_review ?? 0) > 0 ? t("{n} in review", { n: doc.items.needs_review }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  {doc?.failReason && !isPruned(doc) ? (
                    <Text size="caption" tone="danger">
                      {doc.failReason}
                    </Text>
                  ) : null}
                  {doc
                    ? describeOutcome(doc, t).map((line) => (
                        <Text key={line} size="caption" tone="tertiary">
                          {line}
                        </Text>
                      ))
                    : null}
                  {showPicker && doc ? (
                    <LabelPicker
                      initialRole={
                        DOCUMENT_ROLE_OPTIONS.includes(doc.role as RoleOption) ? (doc.role as RoleOption) : "knowledge"
                      }
                      initialKind={
                        DOCUMENT_KIND_OPTIONS.includes(doc.kind as KindOption) ? (doc.kind as KindOption) : "other"
                      }
                      busy={busyId === doc.id}
                      onApply={(role, kind) => void label(doc.id, role, kind)}
                      onCancel={relabelId === doc.id ? () => setRelabelId(null) : undefined}
                    />
                  ) : null}
                </div>
                {doc && !showPicker && !isPruned(doc) ? (
                  <div className={styles.cardActions}>
                    <Button size="sm" variant="ghost" onClick={() => setRelabelId(doc.id)}>
                      {t("Relabel")}
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LabelPicker({
  initialRole,
  initialKind,
  busy,
  onApply,
  onCancel,
}: {
  initialRole: RoleOption;
  initialKind: KindOption;
  busy: boolean;
  onApply: (role: RoleOption, kind: KindOption) => void;
  onCancel?: () => void;
}) {
  const t = useT();
  const [role, setRole] = useState<RoleOption>(initialRole);
  const [kind, setKind] = useState<KindOption>(initialKind);
  return (
    <div className={styles.form}>
      <Text size="caption" tone="tertiary">
        {t("What is this file? The role decides which stage consumes it.")}
      </Text>
      <SegmentedControl
        ariaLabel={t("Document role")}
        value={role}
        onChange={setRole}
        options={DOCUMENT_ROLE_OPTIONS.map((value) => ({ value, label: t(`role:${value}`) }))}
      />
      <SegmentedControl
        ariaLabel={t("Document kind")}
        value={kind}
        onChange={setKind}
        options={DOCUMENT_KIND_OPTIONS.map((value) => ({ value, label: t(`kind:${value}`) }))}
      />
      <div className={styles.formActions}>
        <Button size="sm" loading={busy} onClick={() => onApply(role, kind)}>
          {t("Apply label & reprocess")}
        </Button>
        {onCancel ? (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {t("Cancel")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
