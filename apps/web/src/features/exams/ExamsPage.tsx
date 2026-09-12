import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ExamActivityEvent, ExamActivityTimelineDto, ExamCatalogItemDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useLocale, useT } from "../../i18n";
import {
  Badge,
  Button,
  EmptyState,
  Heading,
  PageSkeleton,
  SegmentedControl,
  Stack,
  Text,
} from "../../ui";
import styles from "./ExamsPage.module.css";

type BankFilter = "all" | "ready" | "building" | "empty";
type KindFilter = "all" | "concurso" | "oab";
type SortKey = "questions" | "title" | "org" | "status";

const PAGE_SIZE = 10;

function bankTone(item: ExamCatalogItemDto): "success" | "warning" | "neutral" {
  if (item.bankQuestionCount <= 0) return "warning";
  if (item.bankReady) return "success";
  return "neutral";
}

function stepTone(
  status: ExamActivityEvent["status"],
): "success" | "warning" | "danger" | "neutral" | "accent" {
  if (status === "success") return "success";
  if (status === "error") return "danger";
  if (status === "pending" || status === "running") return "warning";
  if (status === "skipped") return "neutral";
  return "accent";
}

/** Catalog of tracked open public exams (internal: exam catalog). */
export function ExamsPage() {
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useLocale();
  const searchId = useId();
  const sortId = useId();
  const [items, setItems] = useState<ExamCatalogItemDto[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [preparingId, setPreparingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [bankFilter, setBankFilter] = useState<BankFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("questions");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ExamActivityTimelineDto | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ exams: ExamCatalogItemDto[] }>("/exams");
        setItems(res.exams);
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [t]);

  useEffect(() => {
    if (!selectedId) {
      setTimeline(null);
      setTimelineError("");
      return;
    }
    let cancelled = false;
    setTimelineLoading(true);
    setTimelineError("");
    void (async () => {
      try {
        const res = await api<ExamActivityTimelineDto>(`/exams/${selectedId}/activity`);
        if (!cancelled) setTimeline(res);
      } catch (err) {
        if (!cancelled) {
          setTimeline(null);
          setTimelineError(
            localizeApiError(err instanceof Error ? err.message : "Failed to load", t),
          );
        }
      } finally {
        if (!cancelled) setTimelineLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, t]);

  const inventory = useMemo(() => {
    let ready = 0;
    let building = 0;
    let empty = 0;
    let questions = 0;
    for (const item of items) {
      questions += item.bankQuestionCount;
      if (item.bankQuestionCount <= 0) empty += 1;
      else if (item.bankReady) ready += 1;
      else building += 1;
    }
    return { ready, building, empty, questions, total: items.length };
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = items.filter((item) => {
      if (kindFilter !== "all" && (item.kind ?? "concurso") !== kindFilter) return false;
      if (bankFilter === "ready" && !item.bankReady) return false;
      if (bankFilter === "building" && (item.bankQuestionCount <= 0 || item.bankReady)) {
        return false;
      }
      if (bankFilter === "empty" && item.bankQuestionCount > 0) return false;
      if (!q) return true;
      const hay = [item.title, item.org, item.banca, item.examSlug, ...item.emphasis]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    rows = [...rows].sort((a, b) => {
      if (sortKey === "questions") {
        if (b.bankQuestionCount !== a.bankQuestionCount) {
          return b.bankQuestionCount - a.bankQuestionCount;
        }
        if (a.bankReady !== b.bankReady) return a.bankReady ? -1 : 1;
      }
      if (sortKey === "status") {
        if (a.status !== b.status) return a.status === "open" ? -1 : 1;
        if (a.bankReady !== b.bankReady) return a.bankReady ? -1 : 1;
      }
      if (sortKey === "org") {
        return (a.org ?? "").localeCompare(b.org ?? "", undefined, { sensitivity: "base" });
      }
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });

    return rows;
  }, [items, query, bankFilter, kindFilter, sortKey]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query, bankFilter, kindFilter, sortKey]);

  async function openStudy(item: ExamCatalogItemDto) {
    setPreparingId(item.id);
    setError("");
    try {
      const prepared = await api<{ topicId: string }>(`/exams/${item.id}/prepare`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      navigate(`/topics/${prepared.topicId}/study`, {
        state: { examTitle: item.title, examSlug: item.examSlug },
      });
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Failed to prepare", t));
    } finally {
      setPreparingId(null);
    }
  }

  function bankLabel(item: ExamCatalogItemDto): string {
    if (item.bankQuestionCount <= 0) return t("No questions yet");
    if (item.bankReady) return t("{n} questions ready", { n: item.bankQuestionCount });
    return t("Building bank ({n})", { n: item.bankQuestionCount });
  }

  function bankHint(item: ExamCatalogItemDto): string | null {
    if (item.bankQuestionCount <= 0) {
      return t("Crawler has not filled this bank yet — study will generate from scratch.");
    }
    if (!item.bankReady) {
      return t("A few questions cached; more will arrive as the crawler runs.");
    }
    return null;
  }

  function clearControls() {
    setQuery("");
    setBankFilter("all");
    setKindFilter("all");
    setSortKey("questions");
    setPage(1);
  }

  function formatAt(iso: string | null | undefined): string {
    if (!iso) return t("No timestamp yet");
    try {
      return new Date(iso).toLocaleString(locale);
    } catch {
      return iso;
    }
  }

  function statusLabel(status: ExamActivityEvent["status"]): string {
    if (status === "success") return t("Success");
    if (status === "error") return t("Error");
    if (status === "pending") return t("Pending");
    if (status === "skipped") return t("Skipped");
    if (status === "running") return t("Running");
    return status;
  }

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={5}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {t("Open exams")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Pick an open public exam we track, then set tempo, pill, and focus.")}
        </Text>
      </header>

      <div className={styles.inventory} aria-live="polite">
        <div className={styles.inventoryItem}>
          <span className={styles.inventoryValue}>{inventory.total}</span>
          <span className={styles.inventoryLabel}>{t("Tracked exams")}</span>
        </div>
        <div className={styles.inventoryItem}>
          <span className={[styles.inventoryValue, styles.valueSuccess].join(" ")}>
            {inventory.ready}
          </span>
          <span className={styles.inventoryLabel}>{t("Ready to study")}</span>
        </div>
        <div className={styles.inventoryItem}>
          <span className={styles.inventoryValue}>{inventory.building}</span>
          <span className={styles.inventoryLabel}>{t("Building bank")}</span>
        </div>
        <div className={styles.inventoryItem}>
          <span className={[styles.inventoryValue, styles.valueWarning].join(" ")}>
            {inventory.empty}
          </span>
          <span className={styles.inventoryLabel}>{t("No questions yet")}</span>
        </div>
        <div className={styles.inventoryItem}>
          <span className={[styles.inventoryValue, "qz-tabular"].join(" ")}>
            {inventory.questions}
          </span>
          <span className={styles.inventoryLabel}>{t("Questions in bank")}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <label className="qz-sr-only" htmlFor={searchId}>
          {t("Search exams")}
        </label>
        <input
          id={searchId}
          className={styles.search}
          type="search"
          value={query}
          placeholder={t("Search by name, org, or board…")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <SegmentedControl
          ariaLabel={t("Filter by exam kind")}
          value={kindFilter}
          onChange={setKindFilter}
          options={[
            { value: "all", label: t("All kinds") },
            { value: "concurso", label: t("Concurso") },
            { value: "oab", label: t("OAB") },
          ]}
        />
        <SegmentedControl
          ariaLabel={t("Filter by question bank")}
          value={bankFilter}
          onChange={setBankFilter}
          options={[
            { value: "all", label: t("All ({n})", { n: inventory.total }) },
            { value: "ready", label: t("Ready ({n})", { n: inventory.ready }) },
            { value: "building", label: t("Building ({n})", { n: inventory.building }) },
            { value: "empty", label: t("Empty ({n})", { n: inventory.empty }) },
          ]}
        />
        <label className="qz-sr-only" htmlFor={sortId}>
          {t("Sort exams")}
        </label>
        <select
          id={sortId}
          className={styles.sort}
          value={sortKey}
          onChange={(event) => setSortKey(event.target.value as SortKey)}
        >
          <option value="questions">{t("Sort: questions")}</option>
          <option value="title">{t("Sort: title")}</option>
          <option value="org">{t("Sort: organization")}</option>
          <option value="status">{t("Sort: status")}</option>
        </select>
      </div>

      <div className={styles.metaBar}>
        <Text size="caption" tone="tertiary" className="qz-tabular">
          {filtered.length === 0
            ? t("Showing 0 of {total}", { total: items.length })
            : t("Showing {start}–{end} of {filtered} · {total} tracked", {
                start: rangeStart,
                end: rangeEnd,
                filtered: filtered.length,
                total: items.length,
              })}
        </Text>
        {query || bankFilter !== "all" || kindFilter !== "all" || sortKey !== "questions" ? (
          <Button size="sm" variant="ghost" onClick={clearControls}>
            {t("Clear filters")}
          </Button>
        ) : null}
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          title={t("No open exams yet.")}
          description={t(
            "Catalog stays empty until admin adds sources and Ingestion discovers exams. No content seeds.",
          )}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={t("No exams match your filters.")}
          action={
            <Button size="sm" variant="secondary" onClick={clearControls}>
              {t("Clear filters")}
            </Button>
          }
        />
      ) : (
        <>
          <ul className={styles.list}>
            {pageRows.map((item) => {
              const hint = bankHint(item);
              const emptyBank = item.bankQuestionCount <= 0;
              const selected = selectedId === item.id;
              return (
                <li key={item.id}>
                  <div
                    className={[styles.row, selected ? styles.rowSelected : ""].filter(Boolean).join(" ")}
                    role="button"
                    tabIndex={0}
                    aria-expanded={selected}
                    aria-controls={selected ? `exam-timeline-${item.id}` : undefined}
                    onClick={() => setSelectedId(selected ? null : item.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedId(selected ? null : item.id);
                      }
                    }}
                  >
                    <div className={styles.rowMain}>
                      <h2 className={styles.title}>{item.title}</h2>
                      <div className={styles.sub}>
                        {item.org ? <span>{item.org}</span> : null}
                        {item.banca ? <span>· {item.banca}</span> : null}
                        <Badge tone={item.status === "open" ? "success" : "neutral"}>
                          {item.status === "open" ? t("Open") : t("Unknown")}
                        </Badge>
                        <Badge tone="neutral">
                          {(item.kind ?? "concurso") === "oab" ? t("OAB") : t("Concurso")}
                        </Badge>
                        {item.emphasis.length > 0 ? (
                          <span>{item.emphasis.slice(0, 3).join(" · ")}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className={styles.statusCell}>
                      <Badge tone={bankTone(item)}>{bankLabel(item)}</Badge>
                      {hint ? <p className={styles.statusHint}>{hint}</p> : null}
                    </div>
                    <div className={styles.actions}>
                      <Button
                        size="sm"
                        variant={emptyBank ? "secondary" : "primary"}
                        loading={preparingId === item.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void openStudy(item);
                        }}
                      >
                        {emptyBank ? t("Study anyway") : t("Study this exam")}
                      </Button>
                    </div>
                  </div>

                  {selected ? (
                    <div
                      id={`exam-timeline-${item.id}`}
                      className={styles.detail}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className={styles.detailHeader}>
                        <Heading level={3} size="section">
                          {t("Pipeline status")}
                        </Heading>
                        <Text size="caption" tone="tertiary">
                          {t("Crawler and question-bank steps for this exam.")}
                        </Text>
                      </div>
                      {timelineLoading ? (
                        <Text size="caption" tone="secondary">
                          {t("Loading timeline…")}
                        </Text>
                      ) : null}
                      {timelineError ? (
                        <Text tone="danger" size="caption" role="alert">
                          {timelineError}
                        </Text>
                      ) : null}
                      {timeline && !timelineLoading ? (
                        <ol className={styles.timeline}>
                          {timeline.steps.map((step) => (
                            <li key={step.id} className={styles.timelineItem}>
                              <div
                                className={[
                                  styles.timelineDot,
                                  styles[`dot_${step.status}`] ?? "",
                                ].join(" ")}
                                aria-hidden
                              />
                              <div className={styles.timelineBody}>
                                <div className={styles.timelineTop}>
                                  <span className={styles.timelineTitle}>{step.title}</span>
                                  <Badge tone={stepTone(step.status)}>
                                    {statusLabel(step.status)}
                                  </Badge>
                                </div>
                                <p className={styles.timelineMessage}>{step.message}</p>
                                <time className={styles.timelineAt} dateTime={step.at}>
                                  {formatAt(step.at)}
                                </time>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className={styles.pager}>
            <Text size="caption" tone="tertiary" className="qz-tabular">
              {t("Page {page} of {pages}", { page: safePage, pages: pageCount })}
            </Text>
            <div className={styles.pagerActions}>
              <Button
                size="sm"
                variant="ghost"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("Previous")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={safePage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                {t("Next")}
              </Button>
            </div>
          </div>
        </>
      )}
    </Stack>
  );
}
