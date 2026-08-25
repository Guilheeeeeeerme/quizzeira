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
import type { AttemptStatus, QuizResultsDto } from "@quiz-app/shared";
import { api } from "../../lib/api";

const statusMessages: Record<AttemptStatus, string> = {
  IN_PROGRESS: "Quiz in progress.",
  PENDING: "Submitted — your quiz is queued for automatic correction.",
  IN_CORRECTION: "Your quiz is being corrected automatically.",
  CORRECTED: "Correction complete.",
};

export function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [results, setResults] = useState<QuizResultsDto | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!attemptId) return;
    const data = await api<QuizResultsDto>(`/quiz/${attemptId}/results`);
    setResults(data);
  }, [attemptId]);

  useEffect(() => {
    void load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [load]);

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
          Quiz results
        </Heading>
        <Badge colorPalette={isCorrected ? "green" : "yellow"}>{results.status}</Badge>
        <Text mt={2} color="gray.600">
          {statusMessages[results.status]}
        </Text>
      </Box>

      {!isCorrected && (
        <Card.Root p={5}>
          <Stack gap={3} align="center">
            <Text textAlign="center">
              Your answers were saved. Correction runs automatically — this page will refresh with
              your score and feedback when it&apos;s ready.
            </Text>
            <Spinner size="sm" />
          </Stack>
        </Card.Root>
      )}

      {isCorrected && (
        <>
          <Card.Root p={5}>
            <Heading size="md" mb={2}>
              Score: {results.score}/{results.maxScore}
            </Heading>
            {results.generalComment && <Text>{results.generalComment}</Text>}
          </Card.Root>

          <Stack gap={4}>
            {results.answers.map((answer, i) => (
              <Card.Root key={answer.questionId} p={4}>
                <Text fontWeight="medium" mb={2}>
                  Q{i + 1}. {answer.prompt}
                </Text>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Your answer: {answer.userResponse}
                </Text>
                <Text fontSize="sm">
                  Grade: {answer.grade ?? "—"}/1
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
        <RouterLink to="/">Back to dashboard</RouterLink>
      </Button>
    </Stack>
  );
}
