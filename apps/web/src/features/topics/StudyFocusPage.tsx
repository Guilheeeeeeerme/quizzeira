import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type {
  PillAttemptDto,
  PillStartResponse,
  SessionDurationMinutes,
  TopicDto,
} from "@quizzeira/shared";
import { SESSION_DURATION_MINUTES } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useLocale, useT } from "../../i18n";
import {
  Button,
  Field,
  Heading,
  PageSkeleton,
  Spinner,
  Stack,
  Text,
} from "../../ui";
import { storeQuizSession } from "../quiz/QuizPage";
import fieldStyles from "../../ui/Field.module.css";
import styles from "./Topics.module.css";

interface FocusAreaOption {
  id: string;
  title: string;
  slug: string;
  publishedCount: number;
}

interface FocusSubjectOption {
  slug: string;
  title: string;
  publishedCount: number;
  areaIds: string[];
}

interface SyllabusResponse {
  examSlug: string | null;
  syllabus: { id: string; version: number; status: string } | null;
  focusAreas?: FocusAreaOption[];
  focusSubjects?: FocusSubjectOption[];
}

export function StudyFocusPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const examTitle = (location.state as { examTitle?: string } | null)?.examTitle ?? null;
  const t = useT();
  const { locale } = useLocale();
  const [topic, setTopic] = useState<TopicDto | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusResponse | null>(null);
  const [areaId, setAreaId] = useState<string>("");
  const [subjectSlug, setSubjectSlug] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<SessionDurationMinutes | null>(null);
  const [booting, setBooting] = useState(true);
  const [starting, setStarting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topicId) return;
    void (async () => {
      try {
        const [topicDto, syllabusDto] = await Promise.all([
          api<TopicDto>(`/topics/${topicId}`),
          api<SyllabusResponse>(`/topics/${topicId}/syllabus`).catch(() => null),
        ]);
        setTopic(topicDto);
        setSyllabus(syllabusDto);
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [topicId, t]);

  const areas = useMemo(() => syllabus?.focusAreas ?? [], [syllabus]);

  const subjects = useMemo(() => {
    const list = syllabus?.focusSubjects ?? [];
    if (!areaId) return list;
    return list.filter((s) => s.areaIds.length === 0 || s.areaIds.includes(areaId));
  }, [syllabus, areaId]);

  // Drop subject if area change makes it unavailable.
  useEffect(() => {
    if (!subjectSlug) return;
    if (!subjects.some((s) => s.slug === subjectSlug)) {
      setSubjectSlug("");
    }
  }, [subjects, subjectSlug]);

  async function start() {
    if (!topicId) return;
    setStarting(true);
    setError("");
    try {
      const started = await api<PillStartResponse>(`/topics/${topicId}/pills/start`, {
        method: "POST",
        body: JSON.stringify({
          subjects: subjectSlug ? [subjectSlug] : [],
          positionId: areaId || null,
          durationMinutes,
          // Sample from the exam bank locale, not the UI chrome language.
          locale: topic?.preferredLocale ?? locale,
        }),
      });
      setGenerating(true);
      await waitForPill(started.attemptId);
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Failed to start quiz", t));
      setGenerating(false);
    } finally {
      setStarting(false);
    }
  }

  async function waitForPill(attemptId: string) {
    for (let i = 0; i < 90; i++) {
      const pill = await api<PillAttemptDto>(`/pills/${attemptId}`);
      if (pill.status === "IN_PROGRESS" && pill.questions.length > 0) {
        storeQuizSession(attemptId, pill.questions);
        navigate(`/quiz/${attemptId}`);
        return;
      }
      if (pill.status !== "GENERATING") {
        throw new Error("Pill generation failed");
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    throw new Error("Timed out waiting for pill");
  }

  if (booting) return <PageSkeleton />;
  if (!topic) {
    return (
      <Text tone="danger" size="bodySm" role="alert">
        {error || t("Topic not found")}
      </Text>
    );
  }

  if (generating) {
    return (
      <Stack gap={4} align="center">
        <Spinner size="lg" label={t("Preparing your study pill")} />
        <Text tone="secondary" size="bodySm">
          {durationMinutes
            ? t("Building a timed session from the published bank.")
            : t("Sampling questions from the published bank.")}
        </Text>
      </Stack>
    );
  }

  const hasFocusControls = areas.length > 0 || subjects.length > 0;

  return (
    <Stack gap={6}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {t("Start studying")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {examTitle || topic.title}
        </Text>
        {hasFocusControls ? (
          <Text size="caption" tone="tertiary">
            {t("Optional filters — only options with published questions are shown.")}
          </Text>
        ) : null}
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {areas.length > 0 ? (
        <Field label={t("Edital area")} htmlFor="study-area">
          <select
            id="study-area"
            className={fieldStyles.control}
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
          >
            <option value="">{t("All areas")}</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {subjects.length > 0 ? (
        <Field label={t("Subject")} htmlFor="study-subject">
          <select
            id="study-subject"
            className={fieldStyles.control}
            value={subjectSlug}
            onChange={(e) => setSubjectSlug(e.target.value)}
          >
            <option value="">{t("All subjects")}</option>
            {subjects.map((subject) => (
              <option key={subject.slug} value={subject.slug}>
                {subject.title}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <details className={styles.advanced}>
        <summary>{t("Advanced options")}</summary>
        <Stack gap={4} className={styles.advancedBody}>
          <Field label={t("Session length")}>
            <Text size="caption" tone="tertiary">
              {t("Default is a short pill. Pick a time to scale depth.")}
            </Text>
            <div className={styles.chipRow}>
              <button
                type="button"
                className={`${styles.chip} ${durationMinutes === null ? styles.chipActive : ""}`}
                onClick={() => setDurationMinutes(null)}
              >
                {t("Pill (default)")}
              </button>
              {SESSION_DURATION_MINUTES.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`${styles.chip} ${durationMinutes === mins ? styles.chipActive : ""}`}
                  onClick={() => setDurationMinutes(mins)}
                >
                  {t("{n} min", { n: mins })}
                </button>
              ))}
            </div>
          </Field>
        </Stack>
      </details>

      <div className={styles.actions}>
        <Button onClick={() => void start()} loading={starting}>
          {t("Start studying")}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/")}>
          {t("Back to open exams")}
        </Button>
      </div>
    </Stack>
  );
}
