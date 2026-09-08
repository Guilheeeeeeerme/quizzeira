import { useCallback, useEffect, useState } from "react";
import type { PromptProposalDto, QuestionUpdateProposalDto } from "@quizzeira/shared";
import { AppShell } from "../../shell/AppShell";
import { api } from "../../lib/api";
import { Button, Heading, Text } from "../../ui";
import { useT } from "../../i18n";

export function ProposalsPage() {
  const t = useT();
  const [questions, setQuestions] = useState<QuestionUpdateProposalDto[]>([]);
  const [prompts, setPrompts] = useState<PromptProposalDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [q, p] = await Promise.all([
        api<{ items: QuestionUpdateProposalDto[] }>("/admin/proposals/questions"),
        api<{ items: PromptProposalDto[] }>("/admin/proposals/prompts"),
      ]);
      setQuestions(q.items);
      setPrompts(p.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to load proposals"));
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function act(path: string, id: string) {
    setBusy(id);
    try {
      await api(path, { method: "POST" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Action failed"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <Heading level={1}>{t("Proposals")}</Heading>
      <Text>{t("Review curriculum and prompt changes before they go live.")}</Text>
      {error ? <Text>{error}</Text> : null}

      <Heading level={2}>{t("Question updates")}</Heading>
      {questions.length === 0 ? (
        <Text>{t("No pending question proposals.")}</Text>
      ) : (
        questions.map((item) => (
          <div key={item.id} style={{ marginBottom: "1.5rem" }}>
            <Text>
              {item.questionType} · {item.levelSlug}
            </Text>
            <Text>{item.questionPrompt}</Text>
            {item.reason ? <Text>{item.reason}</Text> : null}
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
              {JSON.stringify(item.proposedPatch, null, 2)}
            </pre>
            <Button
              disabled={busy === item.id}
              onClick={() => void act(`/admin/proposals/questions/${item.id}/approve`, item.id)}
            >
              {t("Approve")}
            </Button>{" "}
            <Button
              disabled={busy === item.id}
              onClick={() => void act(`/admin/proposals/questions/${item.id}/reject`, item.id)}
            >
              {t("Reject")}
            </Button>
          </div>
        ))
      )}

      <Heading level={2}>{t("Prompt proposals")}</Heading>
      {prompts.length === 0 ? (
        <Text>{t("No pending prompt proposals.")}</Text>
      ) : (
        prompts.map((item) => (
          <div key={item.key} style={{ marginBottom: "1.5rem" }}>
            <Text>
              {item.key} (v{item.currentVersion})
            </Text>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>{item.body}</pre>
            <Button
              disabled={busy === item.key}
              onClick={() =>
                void act(`/admin/proposals/prompts/${item.key}/approve`, item.key)
              }
            >
              {t("Approve")}
            </Button>{" "}
            <Button
              disabled={busy === item.key}
              onClick={() =>
                void act(`/admin/proposals/prompts/${item.key}/reject`, item.key)
              }
            >
              {t("Reject")}
            </Button>
          </div>
        ))
      )}
    </AppShell>
  );
}
