import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Progress,
  RadioGroup,
  Stack,
  Text,
  Textarea,
  Field,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import type { QuizQuestionDto, SubmitAnswer } from "@quiz-app/shared";
import { api } from "../../lib/api";

export function storeQuizSession(attemptId: string, questions: QuizQuestionDto[]) {
  sessionStorage.setItem(`quiz:${attemptId}`, JSON.stringify({ questions }));
}

function loadQuizSession(attemptId: string): QuizQuestionDto[] | null {
  const stored = sessionStorage.getItem(`quiz:${attemptId}`);
  if (!stored) return null;
  return (JSON.parse(stored) as { questions: QuizQuestionDto[] }).questions;
}

export function QuizPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
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
    if (!loaded?.length) {
      navigate("/");
      return;
    }
    setQuestions(loaded);
  }, [attemptId, navigate]);

  const current = questions[step];
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;

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
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  if (!current) {
    return <Text>Loading quiz...</Text>;
  }

  return (
    <Stack gap={6} maxW="2xl">
      <Box>
        <Text fontSize="sm" color="gray.600" mb={2}>
          Question {step + 1} of {questions.length}
        </Text>
        <Progress.Root value={progress} max={100}>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Box>

      <Heading size="md">{current.prompt}</Heading>

      {current.type === "MULTIPLE_CHOICE" && current.options && (
        <RadioGroup.Root
          value={String(answers[current.id]?.selectedIndex ?? "")}
          onValueChange={(d) => setMcqAnswer(Number(d.value))}
        >
          <Stack gap={3}>
            {current.options.map((option, index) => (
              <RadioGroup.Item key={index} value={String(index)}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{option}</RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </Stack>
        </RadioGroup.Root>
      )}

      {current.type === "OPEN" && (
        <Field.Root>
          <Field.Label>Your answer</Field.Label>
          <Textarea
            rows={5}
            value={answers[current.id]?.openText ?? ""}
            onChange={(e) => setOpenAnswer(e.target.value)}
          />
        </Field.Root>
      )}

      {error && <Text color="red.500">{error}</Text>}

      <Stack direction="row" gap={3}>
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < questions.length - 1 ? (
          <Button colorPalette="blue" disabled={!canProceed()} onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button colorPalette="green" loading={loading} disabled={!canProceed()} onClick={() => void handleSubmit()}>
            Submit quiz
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
