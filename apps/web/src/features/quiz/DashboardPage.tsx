import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import type { LevelDto, ProgressItemDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { storeQuizSession } from "./QuizPage";

const statusColor: Record<string, string> = {
  IN_PROGRESS: "gray",
  PENDING: "yellow",
  IN_CORRECTION: "orange",
  CORRECTED: "green",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [recent, setRecent] = useState<ProgressItemDto[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      const [levelsRes, progressRes] = await Promise.all([
        api<{ levels: LevelDto[] }>("/levels"),
        api<{ items: ProgressItemDto[] }>("/progress"),
      ]);
      setLevels(levelsRes.levels);
      setRecent(progressRes.items.slice(0, 5));
    })();
  }, []);

  async function startQuiz(levelSlug: string) {
    setError("");
    setLoading(levelSlug);
    try {
      const data = await api<{ attemptId: string; questions: import("@quizzeira/shared").QuizQuestionDto[] }>("/quiz/start", {
        method: "POST",
        body: JSON.stringify({ levelSlug }),
      });
      storeQuizSession(data.attemptId, data.questions);
      navigate(`/quiz/${data.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Stack gap={8}>
      <Box>
        <Heading size="lg" mb={2}>
          Choose a level
        </Heading>
        <Text color="gray.600">Each quiz has 4 multiple-choice and 1 open question.</Text>
      </Box>

      {error && <Text color="red.500">{error}</Text>}

      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
        {levels.map((level) => (
          <Card.Root key={level.slug} p={5}>
            <Card.Body>
              <Heading size="md" mb={2}>
                {level.label}
              </Heading>
              <Button
                colorPalette="blue"
                onClick={() => void startQuiz(level.slug)}
                loading={loading === level.slug}
              >
                Start quiz
              </Button>
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>

      {recent.length > 0 && (
        <Box>
          <Heading size="md" mb={4}>
            Recent attempts
          </Heading>
          <Stack gap={3}>
            {recent.map((item) => (
              <Card.Root key={item.attemptId} p={4}>
                <FlexRow item={item} onOpen={() => navigate(`/results/${item.attemptId}`)} />
              </Card.Root>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

function FlexRow({ item, onOpen }: { item: ProgressItemDto; onOpen: () => void }) {
  return (
    <Stack direction={{ base: "column", sm: "row" }} justify="space-between" align={{ sm: "center" }} gap={2}>
      <Box>
        <Text fontWeight="medium">{item.levelLabel}</Text>
        <Badge colorPalette={statusColor[item.status] ?? "gray"}>{item.status}</Badge>
        {item.score !== null && (
          <Text fontSize="sm" color="gray.600" mt={1}>
            Score: {item.score}/{item.maxScore}
          </Text>
        )}
      </Box>
      <Button size="sm" variant="outline" onClick={onOpen}>
        View
      </Button>
    </Stack>
  );
}
