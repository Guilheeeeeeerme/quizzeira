import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AttemptStatus, QuizResultsDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import {
  Button,
  Heading,
  Spinner,
  Stack,
  StatusBadge,
  Surface,
  Text,
} from "../../ui";
import styles from "./ResultsPage.module.css";

const statusMessages: Record<AttemptStatus, string> = {
  GENERATING: "Preparing your study pill",
  IN_PROGRESS: "Quiz in progress.",
  PENDING: "Submitted — your quiz is queued for automatic correction.",
  IN_CORRECTION: "Your quiz is being corrected automatically.",
  CORRECTED: "Correction complete.",
};

export function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const [results, setResults] = useState<QuizResultsDto | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!attemptId) return;
    const data = await api<QuizResultsDto>(`/quiz/${attemptId}/results`);
    setResults(data);
  }, [attemptId]);

  useEffect(() => {
    void load().catch((err) =>
      setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t)),
    );
  }, [load, t]);

  useEffect(() => {
    if (!results || results.status === "CORRECTED") return;
    const id = setInterval(() => {
      void load().catch(() => undefined);
    }, 3000);
    return () => clearInterval(id);
  }, [results, load]);

  if (error) {
    return (
      <Text tone="danger" size="bodySm" role="alert">
        {error}
      </Text>
    );
  }

  if (!results) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" label={t("Loading results")} />
      </div>
    );
  }

  const isCorrected = results.status === "CORRECTED";

  return (
    <Stack gap={6} className={styles.root}>
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <Heading level={1} size="page">
            {t("Quiz results")}
          </Heading>
          <StatusBadge status={results.status} />
        </div>
        <Text tone="secondary" size="bodySm">
          {t(statusMessages[results.status])}
        </Text>
      </header>

      {!isCorrected ? (
        <Surface className={styles.pending}>
          <Stack gap={3} align="center">
            <Text size="bodySm" tone="secondary" className={styles.pendingText}>
              {t(
                "Your answers were saved. Correction runs automatically — this page will refresh with your score and feedback when it's ready.",
              )}
            </Text>
            <Spinner size="sm" label={t("Waiting for correction")} />
          </Stack>
        </Surface>
      ) : null}

      {isCorrected ? (
        <>
          <Surface>
            <Stack gap={3}>
              <Heading level={2} size="section">
                <span className="qz-tabular">
                  {t("Score")}: {results.score}/{results.maxScore}
                </span>
              </Heading>
              {results.generalComment ? <Text size="bodySm">{results.generalComment}</Text> : null}
            </Stack>
          </Surface>

          <Stack gap={3}>
            {results.answers.map((answer, i) => (
              <Surface key={answer.questionId}>
                <Stack gap={2}>
                  <Text size="bodySm" className={styles.questionTitle}>
                    {t("Q{index}.", { index: i + 1 })} {answer.prompt}
                  </Text>
                  <Text size="caption" tone="secondary">
                    {t("Your answer:")} {answer.userResponse}
                  </Text>
                  <Text size="caption" className="qz-tabular">
                    {t("Grade:")} {answer.grade ?? "—"}/1
                  </Text>
                  {answer.comment ? (
                    <Text size="caption" tone="secondary">
                      {answer.comment}
                    </Text>
                  ) : null}
                  {answer.correctAnswerSummary ? (
                    <Text size="caption">
                      {t("Correct answer:")} {answer.correctAnswerSummary}
                    </Text>
                  ) : null}
                  {answer.explanation ? (
                    <Text size="bodySm" tone="secondary">
                      {t("Explanation:")} {answer.explanation}
                    </Text>
                  ) : null}
                </Stack>
              </Surface>
            ))}
          </Stack>
        </>
      ) : null}

      <div>
        <Button variant="secondary" onClick={() => navigate("/")}>
          {t("Back to open exams")}
        </Button>
      </div>
    </Stack>
  );
}
