import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { TopicDto, TopicPresetSlug } from "@quizzeira/shared";
import { TOPIC_PRESETS } from "@quizzeira/shared";
import { api, apiUpload } from "../../lib/api";
import { localizeApiError, useLocale, useT } from "../../i18n";
import {
  AlertDialog,
  Button,
  Field,
  Heading,
  IconButton,
  Input,
  PageSkeleton,
  Stack,
  Text,
  Textarea,
} from "../../ui";
import styles from "./Topics.module.css";

export function TopicEditorPage() {
  const { topicId } = useParams<{ topicId: string }>();
  const isNew = !topicId || topicId === "new";
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useLocale();

  const [booting, setBooting] = useState(!isNew);
  const [topic, setTopic] = useState<TopicDto | null>(null);
  const [title, setTitle] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [presetSlug, setPresetSlug] = useState<TopicPresetSlug | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const activeTemplate = useMemo(() => {
    if (!presetSlug) return "";
    return TOPIC_PRESETS.find((p) => p.slug === presetSlug)?.guidelinesTemplate[locale] ?? "";
  }, [presetSlug, locale]);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const data = await api<TopicDto>(`/topics/${topicId}`);
        setTopic(data);
        setTitle(data.title);
        setGuidelines(data.guidelines);
        setPresetSlug(data.presetSlug);
      } catch (err) {
        setError(localizeApiError(err instanceof Error ? err.message : "Failed to load", t));
      } finally {
        setBooting(false);
      }
    })();
  }, [isNew, topicId, t]);

  function selectPreset(slug: TopicPresetSlug) {
    const next = TOPIC_PRESETS.find((p) => p.slug === slug);
    if (!next) return;
    const template = next.guidelinesTemplate[locale];
    const previous = presetSlug
      ? TOPIC_PRESETS.find((p) => p.slug === presetSlug)?.guidelinesTemplate[locale]
      : "";
    if (!guidelines.trim() || guidelines === previous) {
      setGuidelines(template);
    }
    setPresetSlug(slug);
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      if (isNew) {
        const created = await api<TopicDto>("/topics", {
          method: "POST",
          body: JSON.stringify({
            title,
            guidelines,
            presetSlug,
            preferredLocale: locale,
          }),
        });
        navigate(`/topics/${created.id}`, { replace: true });
        setTopic(created);
      } else if (topicId) {
        const updated = await api<TopicDto>(`/topics/${topicId}`, {
          method: "PATCH",
          body: JSON.stringify({ title, guidelines, presetSlug, preferredLocale: locale }),
        });
        setTopic(updated);
      }
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Request failed", t));
    } finally {
      setSaving(false);
    }
  }

  async function addLink() {
    if (!topicId || isNew || !linkUrl.trim()) return;
    setError("");
    try {
      const updated = await api<TopicDto>(`/topics/${topicId}/links`, {
        method: "POST",
        body: JSON.stringify({ url: linkUrl.trim() }),
      });
      setTopic(updated);
      setLinkUrl("");
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Request failed", t));
    }
  }

  async function removeLink(linkId: string) {
    if (!topicId || isNew) return;
    const updated = await api<TopicDto>(`/topics/${topicId}/links/${linkId}`, {
      method: "DELETE",
    });
    setTopic(updated);
  }

  async function onUpload(file: File | null) {
    if (!file || !topicId || isNew) return;
    setError("");
    try {
      const updated = await apiUpload<TopicDto>(`/topics/${topicId}/attachments`, file);
      setTopic(updated);
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Request failed", t));
    }
  }

  async function removeAttachment(attachmentId: string) {
    if (!topicId || isNew) return;
    const updated = await api<TopicDto>(`/topics/${topicId}/attachments/${attachmentId}`, {
      method: "DELETE",
    });
    setTopic(updated);
  }

  async function handleDelete() {
    if (!topicId || isNew) return;
    await api(`/topics/${topicId}`, { method: "DELETE" });
    navigate("/");
  }

  if (booting) return <PageSkeleton />;

  return (
    <Stack gap={6}>
      <header className={styles.header}>
        <Heading level={1} size="page">
          {isNew ? t("New topic") : t("Edit topic")}
        </Heading>
        <Text tone="secondary" size="bodySm">
          {t("Pick a preset to seed guidelines, then customize.")}
        </Text>
        <Text className={styles.ttlNote}>
          {t("Topics unused for 30 days are deleted automatically.")}
        </Text>
      </header>

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      <Stack gap={3}>
        <Text size="caption" tone="secondary">
          {t("Preset")}
        </Text>
        <div className={styles.chipRow}>
          {TOPIC_PRESETS.map((preset) => (
            <button
              key={preset.slug}
              type="button"
              className={`${styles.chip} ${presetSlug === preset.slug ? styles.chipActive : ""}`}
              onClick={() => selectPreset(preset.slug)}
            >
              {preset.label[locale]}
            </button>
          ))}
        </div>
      </Stack>

      <Field label={t("Title")}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field
        label={t("Guidelines")}
        hint={activeTemplate ? t("Editable — preset is only a starting point.") : undefined}
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
        {!isNew ? (
          <Button variant="secondary" onClick={() => navigate(`/topics/${topicId}/study`)}>
            {t("Study now")}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => navigate("/")}>
          {t("Back")}
        </Button>
      </div>

      {!isNew && topic ? (
        <Stack gap={6}>
          <Stack gap={3}>
            <Heading level={2} size="section">
              {t("Links")}
            </Heading>
            <Text size="caption" tone="secondary">
              {t("Add careers pages, job posts, or study resources. We fetch public pages when possible.")}
            </Text>
            <div className={styles.actions}>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
              />
              <Button variant="secondary" onClick={() => void addLink()} disabled={!linkUrl.trim()}>
                {t("Add link")}
              </Button>
            </div>
            <Stack gap={2}>
              {topic.links.map((link) => (
                <div key={link.id} className={styles.actions}>
                  <Text size="caption">{link.label ?? link.url}</Text>
                  <Text size="caption" tone="tertiary">
                    {link.fetchStatus}
                  </Text>
                  <IconButton label={t("Remove")} onClick={() => void removeLink(link.id)}>
                    ×
                  </IconButton>
                </div>
              ))}
            </Stack>
          </Stack>

          <Stack gap={3}>
            <Heading level={2} size="section">
              {t("Attachments")}
            </Heading>
            <input
              type="file"
              onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
              aria-label={t("Upload file")}
            />
            <Stack gap={2}>
              {topic.attachments.map((file) => (
                <div key={file.id} className={styles.actions}>
                  <Text size="caption">
                    {file.filename} ({file.kind})
                  </Text>
                  <IconButton
                    label={t("Remove")}
                    onClick={() => void removeAttachment(file.id)}
                  >
                    ×
                  </IconButton>
                </div>
              ))}
            </Stack>
          </Stack>

          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            {t("Delete topic")}
          </Button>
        </Stack>
      ) : null}

      <AlertDialog
        open={confirmDelete}
        title={t("Delete topic?")}
        description={t("This removes the topic, materials, and related study pills.")}
        confirmLabel={t("Delete topic")}
        cancelLabel={t("Cancel")}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </Stack>
  );
}
