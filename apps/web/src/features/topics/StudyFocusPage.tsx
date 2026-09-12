import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import type {
  PillAttemptDto,
  PillStartResponse,
  SessionDurationMinutes,
  TopicDto,
} from "@quizzeira/shared";
import { SESSION_DURATION_MINUTES, TOPIC_PRESETS } from "@quizzeira/shared";
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
  Textarea,
} from "../../ui";
import { storeQuizSession } from "../quiz/QuizPage";
import styles from "./Topics.module.css";

interface SyllabusNodeDto {
  id: string;
  parentId: string | null;
  depth: number;
  title: string;
  pathSlug: string;
  scope: string | null;
}

interface SyllabusResponse {
  examSlug: string | null;
  syllabus: { id: string; version: number; status: string } | null;
  nodes: SyllabusNodeDto[];
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
  const [selectedLeaves, setSelectedLeaves] = useState<string[]>([]);
  const [focusText, setFocusText] = useState("");
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

  const examples = useMemo(() => {
    if (!topic?.presetSlug) return [];
    return TOPIC_PRESETS.find((p) => p.slug === topic.presetSlug)?.focusExamples[locale] ?? [];
  }, [topic, locale]);

  const leaves = useMemo(() => {
    const nodes = syllabus?.nodes ?? [];
    const parentIds = new Set(nodes.map((n) => n.parentId).filter(Boolean));
    return nodes.filter((n) => !parentIds.has(n.id));
  }, [syllabus]);

  function toggleLeaf(id: string) {
    setSelectedLeaves((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function appendExample(example: string) {
    setFocusText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return example;
      if (trimmed.includes(example)) return trimmed;
      return `${trimmed}, ${example}`;
    });
  }

  async function start(withFocus: boolean) {
    if (!topicId) return;
    setStarting(true);
    setError("");
    try {
      const started = await api<PillStartResponse>(`/topics/${topicId}/pills/start`, {
        method: "POST",
        body: JSON.stringify({
          focusText: withFocus ? focusText.trim() || null : null,
          syllabusNodeIds: selectedLeaves,
          durationMinutes,
          locale,
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
            ? t("The AI is inferring subjects and building a timed session.")
            : t("The AI is choosing question types and length for a short session.")}
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={6}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {t("What do you want to focus on today?")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {examTitle || topic.title}
        </Text>
        <Text size="caption" tone="tertiary">
          {t("Optional — skip to let the AI use your topic guidelines")}
        </Text>
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

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

      {leaves.length > 0 ? (
        <Field label={t("Syllabus focus")}>
          <Text size="caption" tone="tertiary">
            {t("Pick syllabus leaves to sample from, or leave empty for the full bank.")}
          </Text>
          <div className={styles.chipRow}>
            {leaves.slice(0, 40).map((leaf) => (
              <button
                key={leaf.id}
                type="button"
                className={`${styles.chip} ${selectedLeaves.includes(leaf.id) ? styles.chipActive : ""}`}
                onClick={() => toggleLeaf(leaf.id)}
              >
                {leaf.title}
              </button>
            ))}
          </div>
        </Field>
      ) : null}

      <Field label={t("Today's focus")}>
        <Textarea
          rows={4}
          value={focusText}
          onChange={(e) => setFocusText(e.target.value)}
          placeholder={t("e.g. emphasize logical reasoning; avoid legislation today")}
        />
      </Field>

      {examples.length ? (
        <Stack gap={2}>
          <Text size="caption" tone="secondary">
            {t("Examples")}
          </Text>
          <div className={styles.chipRow}>
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                className={styles.chip}
                onClick={() => appendExample(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </Stack>
      ) : null}

      <div className={styles.actions}>
        <Button onClick={() => void start(true)} loading={starting}>
          {t("Start studying")}
        </Button>
        <Button variant="ghost" onClick={() => void start(false)} disabled={starting}>
          {t("Skip and start")}
        </Button>
        <Button variant="secondary" onClick={() => navigate("/")}>
          {t("Back to open exams")}
        </Button>
      </div>
    </Stack>
  );
}
