import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ExamCatalogItemDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import {
  Badge,
  Button,
  EmptyState,
  Grid,
  Heading,
  PageSkeleton,
  Stack,
  Surface,
  Text,
} from "../../ui";
import styles from "../topics/Topics.module.css";

/** Catalog of tracked open public exams (internal: exam catalog). */
export function ExamsPage() {
  const navigate = useNavigate();
  const t = useT();
  const [items, setItems] = useState<ExamCatalogItemDto[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");
  const [preparingId, setPreparingId] = useState<string | null>(null);

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

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={8}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {t("Open exams")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Pick an open public exam we track, then set tempo, pill, and focus.")}
        </Text>
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title={t("No open exams yet.")} />
      ) : (
        <Grid columns={2} gap={4}>
          {items.map((item) => (
            <Surface key={item.id} className={styles.topicCard}>
              <Stack gap={3}>
                <Heading level={2} size="card">
                  {item.title}
                </Heading>
                <div className={styles.meta}>
                  {item.org ? (
                    <Text size="caption" tone="tertiary">
                      {item.org}
                    </Text>
                  ) : null}
                  {item.banca ? (
                    <Text size="caption" tone="tertiary">
                      {item.banca}
                    </Text>
                  ) : null}
                  <Badge tone={item.status === "open" ? "success" : "neutral"}>
                    {item.status === "open" ? t("Open") : t("Unknown")}
                  </Badge>
                  <Badge tone={item.bankReady ? "success" : "neutral"}>
                    {item.bankReady
                      ? t("Bank ready ({n})", { n: item.bankQuestionCount })
                      : t("Bank warming ({n})", { n: item.bankQuestionCount })}
                  </Badge>
                  {item.placeholder ? (
                    <Text size="caption" tone="tertiary">
                      {t("Catalog seed")}
                    </Text>
                  ) : null}
                </div>
                {item.emphasis.length > 0 ? (
                  <Text size="caption" tone="secondary">
                    {item.emphasis.join(" · ")}
                  </Text>
                ) : null}
                <div className={styles.actions}>
                  <Button
                    size="sm"
                    loading={preparingId === item.id}
                    onClick={() => void openStudy(item)}
                  >
                    {t("Study this exam")}
                  </Button>
                </div>
              </Stack>
            </Surface>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
