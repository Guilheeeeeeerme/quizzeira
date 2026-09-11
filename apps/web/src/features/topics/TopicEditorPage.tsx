import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { TopicDto } from "@quizzeira/shared";
import { getTopicPreset } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useLocale, useT } from "../../i18n";
import {
  AlertDialog,
  Button,
  Field,
  Heading,
  Input,
  PageSkeleton,
  Stack,
  Text,
  Textarea,
} from "../../ui";
import styles from "./Topics.module.css";

const OPEN_EXAM_PRESET = "open_exam" as const;

/** Edit exam + focus guidelines for an open-exam study config (create via Open exams catalog). */
export function TopicEditorPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const isNew = !topicId || topicId === "new";
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useLocale();
  const openExamPreset = getTopicPreset(OPEN_EXAM_PRESET);

  const [booting, setBooting] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeTemplate = useMemo(
    () => openExamPreset?.guidelinesTemplate[locale] ?? "",
    [openExamPreset, locale],
  );

  useEffect(() => {
    if (!isNew) return;
    navigate("/", { replace: true });
  }, [isNew, navigate]);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const data = await api<TopicDto>(`/topics/${topicId}`);
        setTitle(data.title);
        setGuidelines(data.guidelines);
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [isNew, topicId, t]);

  async function save() {
    if (!topicId || isNew) return;
    setSaving(true);
    setError("");
    try {
      await api<TopicDto>(`/topics/${topicId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          guidelines,
          presetSlug: OPEN_EXAM_PRESET,
          preferredLocale: locale,
        }),
      });
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Request failed", t));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!topicId || isNew) return;
    await api(`/topics/${topicId}`, { method: "DELETE" });
    navigate("/");
  }

  if (isNew || booting) return <PageSkeleton />;

  return (
    <Stack gap={6}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {t("Edit study config")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Exam, emphasis, and guidelines only — pick the exam from the open exams catalog.")}
        </Text>
        <Text className={styles.ttlNote}>
          {t("Studies unused for 30 days are deleted automatically.")}
        </Text>
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      <Field label={t("Title")}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field
        label={t("Guidelines")}
        hint={activeTemplate ? t("Editable — open exam guidelines are a starting point.") : undefined}
      >
        <Textarea
          rows={10}
          value={guidelines}
          onChange={(e) => setGuidelines(e.target.value)}
        />
      </Field>

      <div className={styles.actions}>
        <Button onClick={() => void save()} loading={saving} disabled={!title.trim() || !guidelines.trim()}>
          {t("Save")}
        </Button>
        {topicId ? (
          <Button variant="secondary" onClick={() => navigate(`/topics/${topicId}/study`)}>
            {t("Study now")}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => navigate("/")}>
          {t("Back")}
        </Button>
      </div>

      <Button variant="danger" onClick={() => setConfirmDelete(true)}>
        {t("Delete topic")}
      </Button>

      <AlertDialog
        open={confirmDelete}
        title={t("Delete topic?")}
        description={t("This removes the study config and related study pills.")}
        confirmLabel={t("Delete topic")}
        cancelLabel={t("Cancel")}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Stack>
  );
}
