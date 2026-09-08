import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TopicListItemDto } from "@quizzeira/shared";
import { TOPIC_PRESETS } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useLocale, useT } from "../../i18n";
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

export function TopicsPage() {
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useLocale();
  const [topics, setTopics] = useState<TopicListItemDto[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ topics: TopicListItemDto[] }>("/topics");
        setTopics(res.topics);
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
          {t("Your topics")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Create study topics, attach materials, and take short daily pills.")}
        </Text>
        <Text className={styles.ttlNote}>
          {t("Topics unused for 30 days are deleted automatically.")}
        </Text>
      </header>

      <div className={styles.actions}>
        <Button onClick={() => navigate("/topics/new")}>{t("New topic")}</Button>
      </div>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {topics.length === 0 ? (
        <EmptyState title={t("No topics yet.")} />
      ) : (
        <Grid columns={3} gap={4}>
          {topics.map((topic) => {
            const preset = TOPIC_PRESETS.find((p) => p.slug === topic.presetSlug);
            return (
              <Surface key={topic.id} className={styles.topicCard}>
                <Stack gap={4}>
                  <Heading level={2} size="card">
                    {topic.title}
                  </Heading>
                  <div className={styles.meta}>
                    {preset ? (
                      <Text size="caption" tone="tertiary">
                        {preset.label[locale]}
                      </Text>
                    ) : null}
                    <Text size="caption" tone="tertiary">
                      {t("{n} files", { n: topic.attachmentCount })} ·{" "}
                      {t("{n} links", { n: topic.linkCount })}
                    </Text>
                  </div>
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
            );
          })}
        </Grid>
      )}
    </Stack>
  );
}
