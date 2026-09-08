import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProgressItemDto, ProgressSummaryDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useLocale, useT } from "../../i18n";
import {
  Button,
  EmptyState,
  Grid,
  Heading,
  PageSkeleton,
  Stack,
  StatusBadge,
  Surface,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Text,
} from "../../ui";
import styles from "./ProgressPage.module.css";

export function ProgressPage() {
  const { locale } = useLocale();
  const t = useT();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProgressItemDto[]>([]);
  const [summary, setSummary] = useState<ProgressSummaryDto[]>([]);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [progress, summaryRes] = await Promise.all([
          api<{ items: ProgressItemDto[] }>("/progress"),
          api<{ summary: ProgressSummaryDto[] }>("/progress/summary"),
        ]);
        setItems(progress.items);
        setSummary(summaryRes.summary);
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
          {t("Your progress")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Track attempts and scores across every level.")}
        </Text>
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      <section className={styles.section}>
        <Heading level={2} size="section">
          {t("Summary by level")}
        </Heading>
        {summary.length === 0 ? (
          <EmptyState title={t("No attempts yet.")} />
        ) : (
          <Grid columns={3} gap={3}>
            {summary.map((s) => (
              <Surface key={s.levelSlug}>
                <Stack gap={2}>
                  <Text size="bodySm" className={styles.summaryTitle}>
                    {s.levelLabel}
                  </Text>
                  <Text size="caption" tone="secondary" className="qz-tabular">
                    {t("Attempts:")} {s.attemptCount}
                    {s.bestScore !== null ? ` · ${t("Best:")} ${s.bestScore}/5` : ""}
                    {s.lastScore !== null ? ` · ${t("Last:")} ${s.lastScore}/5` : ""}
                  </Text>
                </Stack>
              </Surface>
            ))}
          </Grid>
        )}
      </section>

      <section className={styles.section}>
        <Heading level={2} size="section">
          {t("All attempts")}
        </Heading>
        {items.length === 0 ? (
          <EmptyState
            title={t("No attempts yet.")}
            description={t("Start a quiz from the dashboard to see history here.")}
            action={
              <Button size="sm" variant="secondary" onClick={() => navigate("/")}>
                {t("Back to dashboard")}
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("Level")}</TH>
                <TH>{t("Status")}</TH>
                <TH>{t("Score")}</TH>
                <TH>{t("Submitted")}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.attemptId}>
                  <TD>{item.levelLabel}</TD>
                  <TD>
                    <StatusBadge status={item.status} />
                  </TD>
                  <TD numeric>
                    {item.score !== null ? `${item.score}/${item.maxScore}` : "—"}
                  </TD>
                  <TD>
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString(locale) : "—"}
                  </TD>
                  <TD>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/results/${item.attemptId}`)}
                    >
                      {t("View")}
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>
    </Stack>
  );
}
