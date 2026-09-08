import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { LevelDto, ProgressItemDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import {
  Button,
  EmptyState,
  Grid,
  Heading,
  PageSkeleton,
  Stack,
  StatusBadge,
  Surface,
  Text,
} from "../../ui";
import { storeQuizSession } from "./QuizPage";
import styles from "./DashboardPage.module.css";

export function DashboardPage() {
  const navigate = useNavigate();
  const t = useT();
  const [levels, setLevels] = useState<LevelDto[]>([]);
  const [recent, setRecent] = useState<ProgressItemDto[]>([]);
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [levelsRes, progressRes] = await Promise.all([
          api<{ levels: LevelDto[] }>("/levels"),
          api<{ items: ProgressItemDto[] }>("/progress"),
        ]);
        setLevels(levelsRes.levels);
        setRecent(progressRes.items.slice(0, 5));
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [t]);

  async function startQuiz(levelSlug: string) {
    setError("");
    setLoading(levelSlug);
    try {
      const data = await api<{
        attemptId: string;
        questions: import("@quizzeira/shared").QuizQuestionDto[];
      }>("/quiz/start", {
        method: "POST",
        body: JSON.stringify({ levelSlug }),
      });
      storeQuizSession(data.attemptId, data.questions);
      navigate(`/quiz/${data.attemptId}`);
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Failed to start quiz", t));
    } finally {
      setLoading(null);
    }
  }

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={8}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {t("Choose a level")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Each quiz has 4 multiple-choice and 1 open question.")}
        </Text>
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      {levels.length === 0 ? (
        <EmptyState title={t("No levels available.")} />
      ) : (
        <Grid columns={3} gap={4}>
          {levels.map((level) => (
            <Surface key={level.slug} className={styles.levelCard}>
              <Stack gap={4}>
                <Heading level={2} size="card">
                  {level.label}
                </Heading>
                <Text size="caption" tone="tertiary">
                  {t("4 MCQ · 1 open")}
                </Text>
                <Button
                  onClick={() => void startQuiz(level.slug)}
                  loading={loading === level.slug}
                  fullWidth
                >
                  {t("Start quiz")}
                </Button>
              </Stack>
            </Surface>
          ))}
        </Grid>
      )}

      <section className={styles.recent}>
        <Heading level={2} size="section">
          {t("Recent attempts")}
        </Heading>
        {recent.length === 0 ? (
          <EmptyState
            title={t("No attempts yet.")}
            description={t("Pick a level above to start your first quiz.")}
          />
        ) : (
          <Stack gap={2}>
            {recent.map((item) => (
              <Surface key={item.attemptId} className={styles.attemptRow} padded={false}>
                <div className={styles.attemptInner}>
                  <div className={styles.attemptMeta}>
                    <Text size="bodySm" className={styles.attemptTitle}>
                      {item.levelLabel}
                    </Text>
                    <div className={styles.attemptBadges}>
                      <StatusBadge status={item.status} />
                      {item.score !== null ? (
                        <Text size="caption" tone="secondary" className="qz-tabular">
                          {t("Score")}: {item.score}/{item.maxScore}
                        </Text>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/results/${item.attemptId}`)}
                  >
                    {t("View")}
                  </Button>
                </div>
              </Surface>
            ))}
          </Stack>
        )}
      </section>
    </Stack>
  );
}
