import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TopicListItemDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import {
  Button,
  EmptyState,
  Grid,
  Heading,
  PageSkeleton,
  Stack,
  Surface,
  Text,
} from "../../ui";
import styles from "./Topics.module.css";

/** Secondary “my study configs” list — primary entry is Open exams catalog. */
export function TopicsPage() {
  const navigate = useNavigate();
  const t = useT();
  const [topics, setTopics] = useState<TopicListItemDto[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ topics: TopicListItemDto[] }>("/topics");
        setTopics(res.topics.filter((topic) => topic.presetSlug === "open_exam" || !topic.presetSlug));
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [t]);

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={8}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {t("My studies")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Your prepared exam study configs. Start from Open exams to pick a tracked exam.")}
        </Text>
      </header>

      <div className={styles.actions}>
        <Button onClick={() => navigate("/exams")}>{t("Browse open exams")}</Button>
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {topics.length === 0 ? (
        <EmptyState title={t("No studies yet.")} />
      ) : (
        <Grid columns={3} gap={4}>
          {topics.map((topic) => (
            <Surface key={topic.id} className={styles.topicCard}>
              <Stack gap={4}>
                <Heading level={2} size="card">
                  {topic.title}
                </Heading>
                <div className={styles.actions}>
                  <Button size="sm" onClick={() => navigate(`/topics/${topic.id}/study`)}>
                    {t("Study now")}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/topics/${topic.id}`)}
                  >
                    {t("Edit")}
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
