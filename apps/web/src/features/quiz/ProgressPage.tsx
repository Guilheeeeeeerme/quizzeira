import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProgressItemDto } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useLocale, useT } from "../../i18n";
import {
  Button,
  EmptyState,
  Heading,
  PageSkeleton,
  Stack,
  StatusBadge,
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
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const progress = await api<{ items: ProgressItemDto[] }>("/progress");
        setItems(progress.items);
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
          {t("Track attempts and scores across your topics.")}
        </Text>
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      <section className={styles.section}>
        <Heading level={2} size="section">
          {t("All attempts")}
        </Heading>
        {items.length === 0 ? (
          <EmptyState
            title={t("No attempts yet.")}
            description={t("Start a study pill from an open exam to see history here.")}
            action={
              <Button size="sm" variant="secondary" onClick={() => navigate("/")}>
                {t("Open exams")}
              </Button>
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t("Topic")}</TH>
                <TH>{t("Status")}</TH>
                <TH>{t("Score")}</TH>
                <TH>{t("Submitted")}</TH>
                <TH />
              </TR>
            </THead>
            <TBody>
              {items.map((item) => (
                <TR key={item.attemptId}>
                  <TD>{item.topicTitle ?? item.levelLabel}</TD>
                  <TD>
                    <StatusBadge status={item.status} />
                  </TD>
                  <TD numeric>
                    {item.score !== null ? `${item.score}/${item.maxScore}` : "—"}
                  </TD>
                  <TD>
                    {item.submittedAt
                      ? new Date(item.submittedAt).toLocaleString(locale)
                      : "—"}
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
