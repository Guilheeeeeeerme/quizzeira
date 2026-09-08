import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { QuizQuestionDto, SubmitAnswer } from "@quizzeira/shared";
import { choiceLetter, normalizeQuestionPresentation } from "@quizzeira/shared";
import { api } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import {
  Button,
  Field,
  Progress,
  RadioGroup,
  RadioItem,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "../../ui";
import { QuestionMedia } from "./QuestionMedia";
import { QuestionStem } from "./QuestionStem";
import styles from "./QuizPage.module.css";

export function storeQuizSession(attemptId: string, questions: QuizQuestionDto[]) {
  sessionStorage.setItem(`quiz:${attemptId}`, JSON.stringify({ questions }));
}

function loadQuizSession(attemptId: string): QuizQuestionDto[] | null {
  const stored = sessionStorage.getItem(`quiz:${attemptId}`);
  if (!stored) return null;
  return (JSON.parse(stored) as { questions: QuizQuestionDto[] }).questions;
}

function presentQuestion(q: QuizQuestionDto): QuizQuestionDto {
  const normalized = normalizeQuestionPresentation({
    prompt: q.prompt,
    options: q.options ?? null,
    promptMedia: q.promptMedia,
    optionMedia: q.optionMedia,
  });
  return {
    ...q,
    prompt: normalized.prompt,
    options: normalized.options ?? undefined,
    promptMedia: normalized.promptMedia.length ? normalized.promptMedia : undefined,
    optionMedia: normalized.optionMedia?.some(Boolean) ? normalized.optionMedia : undefined,
  };
}

export function QuizPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SubmitAnswer>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!attemptId) {
      navigate("/");
      return;
    }
    const loaded = loadQuizSession(attemptId);
    if (loaded?.length) {
      setQuestions(loaded.map(presentQuestion));
      return;
    }
    void (async () => {
      try {
        const pill = await api<{
          status: string;
          questions: QuizQuestionDto[];
        }>(`/pills/${attemptId}`);
        if (pill.questions?.length) {
          const presented = pill.questions.map(presentQuestion);
          storeQuizSession(attemptId, presented);
          setQuestions(presented);
          return;
        }
      } catch {
        // fall through
      }
      navigate("/");
    })();
  }, [attemptId, navigate]);

  const current = questions[step];
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;
  const presented = useMemo(
    () => (current ? presentQuestion(current) : null),
    [current],
  );

  function setMcqAnswer(selectedIndex: number) {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { questionId: current.id, selectedIndex },
    }));
  }

  function setOpenAnswer(openText: string) {
    if (!current) return;
    setAnswers((prev) => ({
      ...prev,
      [current.id]: { questionId: current.id, openText },
    }));
  }

  function canProceed() {
    if (!current) return false;
    const a = answers[current.id];
    if (current.type === "OPEN") return Boolean(a?.openText?.trim());
    return a?.selectedIndex !== undefined;
  }

  async function handleSubmit() {
    if (!attemptId) return;
    setLoading(true);
    setError("");
    try {
      const payload = questions.map((q) => answers[q.id]).filter(Boolean);
      await api(`/quiz/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: payload }),
      });
      sessionStorage.removeItem(`quiz:${attemptId}`);
      navigate(`/results/${attemptId}`);
    } catch (err) {
      setError(localizeApiError(err instanceof Error ? err.message : "Submit failed", t));
    } finally {
      setLoading(false);
    }
  }

  if (!presented || !current) {
    return (
      <div className={styles.loading}>
        <Spinner label={t("Loading quiz...")} />
        <Text tone="secondary" size="caption">
          {t("Loading quiz...")}
        </Text>
      </div>
    );
  }

  return (
    <Stack gap={6} className={styles.root}>
      <div className={styles.progressBlock}>
        <Text size="caption" tone="secondary" className="qz-tabular">
          {t("Question {current} of {total}", { current: step + 1, total: questions.length })}
        </Text>
        <Progress
          value={progress}
          label={t("Question {current} of {total}", { current: step + 1, total: questions.length })}
        />
      </div>

      <div className={styles.stemBlock}>
        <QuestionStem text={presented.prompt} />
        <QuestionMedia items={presented.promptMedia} />
      </div>

      {presented.type === "MULTIPLE_CHOICE" && presented.options ? (
        <RadioGroup
          name={`q-${presented.id}`}
          label={t("Answer choices")}
          value={
            answers[current.id]?.selectedIndex === undefined
              ? ""
              : String(answers[current.id]?.selectedIndex)
          }
          onChange={(value) => setMcqAnswer(Number(value))}
        >
          {presented.options.map((option, index) => (
            <RadioItem key={index} value={String(index)}>
              <span className={styles.optionRow}>
                <span className={styles.optionLetter} aria-hidden>
                  {choiceLetter(index)}
                </span>
                <span className={styles.optionBody}>
                  {option ? <span className={styles.optionText}>{option}</span> : null}
                  <QuestionMedia items={presented.optionMedia?.[index]} size="sm" />
                </span>
              </span>
            </RadioItem>
          ))}
        </RadioGroup>
      ) : null}

      {presented.type === "OPEN" ? (
        <Field label={t("Your answer")} htmlFor="open-answer">
          <Textarea
            id="open-answer"
            rows={6}
            value={answers[current.id]?.openText ?? ""}
            onChange={(e) => setOpenAnswer(e.target.value)}
          />
        </Field>
      ) : null}

      {error ? (
        <Text tone="danger" size="caption" role="alert">
          {error}
        </Text>
      ) : null}

      <div className={styles.actions}>
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          {t("Back")}
        </Button>
        {step < questions.length - 1 ? (
          <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
            {t("Next")}
          </Button>
        ) : (
          <Button loading={loading} disabled={!canProceed()} onClick={() => void handleSubmit()}>
            {t("Submit quiz")}
          </Button>
        )}
      </div>
    </Stack>
  );
}
