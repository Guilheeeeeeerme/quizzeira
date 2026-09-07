import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink, useParams } from "react-router-dom";
import type { AttemptStatus, QuizResultsDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";

const statusMessages: Record<AttemptStatus, string> = {
  IN_PROGRESS: "Quiz in progress.",
  PENDING: "Submitted — your quiz is queued for automatic correction.",
  IN_CORRECTION: "Your quiz is being corrected automatically.",
  CORRECTED: "Correction complete.",
};

export function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const t = useT();
  const [results, setResults] = useState<QuizResultsDto | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!attemptId) return;
    const data = await api<QuizResultsDto>(`/quiz/${attemptId}/results`);
    setResults(data);
  }, [attemptId]);

  useEffect(() => {
    void load().catch((err) => setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t)));
  }, [load, t]);

  useEffect(() => {
    if (!results || results.status === "CORRECTED") return;
    const id = setInterval(() => {
      void load().catch(() => undefined);
    }, 3000);
    return () => clearInterval(id);
  }, [results, load]);

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  if (!results) {
    return (
      <Stack align="center" py={12}>
        <Spinner size="lg" />
      </Stack>
    );
  }

  const isCorrected = results.status === "CORRECTED";

  return (
    <Stack gap={6} maxW="2xl">
      <Box>
        <Heading size="lg" mb={2}>
          {t("Quiz results")}
        </Heading>
        <Badge colorPalette={isCorrected ? "green" : "yellow"}>{results.status}</Badge>
        <Text mt={2} color="gray.600">
          {t(statusMessages[results.status])}
        </Text>
      </Box>

      {!isCorrected && (
        <Card.Root p={5}>
          <Stack gap={3} align="center">
            <Text textAlign="center">
              {t(
                "Your answers were saved. Correction runs automatically — this page will refresh with your score and feedback when it's ready.",
              )}
            </Text>
            <Spinner size="sm" />
          </Stack>
        </Card.Root>
      )}

      {isCorrected && (
        <>
          <Card.Root p={5}>
            <Heading size="md" mb={2}>
              {t("Score")}: {results.score}/{results.maxScore}
            </Heading>
            {results.generalComment && <Text>{results.generalComment}</Text>}
          </Card.Root>

          <Stack gap={4}>
            {results.answers.map((answer, i) => (
              <Card.Root key={answer.questionId} p={4}>
                <Text fontWeight="medium" mb={2}>
                  {t("Q{index}.", { index: i + 1 })} {answer.prompt}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  {t("Your answer:")} {answer.userResponse}
                </Text>
                <Text fontSize="sm">
                  {t("Grade:")} {answer.grade ?? "—"}/1
                </Text>
                {answer.comment && (
                  <Text mt={2} fontSize="sm">
                    {answer.comment}
                  </Text>
                )}
              </Card.Root>
            ))}
          </Stack>
        </>
      )}

      <Button variant="outline" alignSelf="start" asChild>
        <RouterLink to="/">{t("Back to dashboard")}</RouterLink>
      </Button>
    </Stack>
  );
}
