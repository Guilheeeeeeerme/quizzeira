import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import type { ProgressItemDto, ProgressSummaryDto } from "@quizzeira/shared";
import { api } from "../../lib/api";

const statusColor: Record<string, string> = {
  IN_PROGRESS: "gray",
  PENDING: "yellow",
  IN_CORRECTION: "orange",
  CORRECTED: "green",
};

export function ProgressPage() {
  const [items, setItems] = useState<ProgressItemDto[]>([]);
  const [summary, setSummary] = useState<ProgressSummaryDto[]>([]);

  useEffect(() => {
    void (async () => {
      const [progress, summaryRes] = await Promise.all([
        api<{ items: ProgressItemDto[] }>("/progress"),
        api<{ summary: ProgressSummaryDto[] }>("/progress/summary"),
      ]);
      setItems(progress.items);
      setSummary(summaryRes.summary);
    })();
  }, []);

  return (
    <Stack gap={8}>
      <Heading size="lg">Your progress</Heading>

      <Box>
        <Heading size="md" mb={4}>
          Summary by level
        </Heading>
        <Stack gap={3}>
          {summary.map((s) => (
            <Card.Root key={s.levelSlug} p={4}>
              <Text fontWeight="medium">{s.levelLabel}</Text>
              <Text fontSize="sm" color="gray.600">
                Attempts: {s.attemptCount}
                {s.bestScore !== null && ` · Best: ${s.bestScore}/5`}
                {s.lastScore !== null && ` · Last: ${s.lastScore}/5`}
              </Text>
            </Card.Root>
          ))}
        </Stack>
      </Box>

      <Box>
        <Heading size="md" mb={4}>
          All attempts
        </Heading>
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Level</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Score</Table.ColumnHeader>
              <Table.ColumnHeader>Submitted</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => (
              <Table.Row key={item.attemptId}>
                <Table.Cell>{item.levelLabel}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={statusColor[item.status] ?? "gray"}>{item.status}</Badge>
                </Table.Cell>
                <Table.Cell>
                  {item.score !== null ? `${item.score}/${item.maxScore}` : "—"}
                </Table.Cell>
                <Table.Cell>
                  {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}
                </Table.Cell>
                <Table.Cell>
                  <Button asChild size="xs" variant="outline">
                    <RouterLink to={`/results/${item.attemptId}`}>View</RouterLink>
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
        {items.length === 0 && <Text color="gray.600">No attempts yet.</Text>}
      </Box>
    </Stack>
  );
}
