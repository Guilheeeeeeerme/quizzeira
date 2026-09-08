import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PillAttemptDto, PillStartResponse, TopicDto } from "@quizzeira/shared";
import { TOPIC_PRESETS } from "@quizzeira/shared";
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

export function StudyFocusPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useLocale();
  const [topic, setTopic] = useState<TopicDto | null>(null);
  const [focusText, setFocusText] = useState("");
  const [booting, setBooting] = useState(true);
  const [starting, setStarting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!topicId) return;
    void (async () => {
      try {
        setTopic(await api<TopicDto>(`/topics/${topicId}`));
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
          {t("The AI is choosing question types and length for a short session.")}
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
          {topic.title}
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

      <Field label={t("Today's focus")}>
        <Textarea
          rows={4}
          value={focusText}
          onChange={(e) => setFocusText(e.target.value)}
          placeholder={t("e.g. History and Geography mock aligned to the notice")}
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
        <Button variant="secondary" onClick={() => navigate(`/topics/${topicId}`)}>
          {t("Back")}
        </Button>
      </div>
    </Stack>
  );
}
