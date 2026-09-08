import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shell/AuthContext";
import { AuthLayout } from "../../shell/AuthLayout";
import { ApiError } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import { Button, Field, InlineLink, Input, Stack, Text } from "../../ui";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemo() {
    setError("");
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate("/");
    } catch (err: unknown) {
      setError(localizeApiError(err instanceof ApiError ? err.message : "Demo sign-in failed", t));
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(localizeApiError(err instanceof ApiError ? err.message : "Login failed", t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("Sign in")} subtitle={t("Continue your AI development quizzes.")}>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field label={t("Email")} htmlFor="login-email">
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              invalid={Boolean(error)}
            />
          </Field>
          <Field label={t("Password")} htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              invalid={Boolean(error)}
            />
          </Field>
          {error ? (
            <Text tone="danger" size="caption" role="alert">
              {error}
            </Text>
          ) : null}
          <Button type="submit" fullWidth loading={loading}>
            {t("Sign in")}
          </Button>
          <div role="separator" aria-orientation="horizontal" className={styles.demoDivider}>
            <span>{t("or")}</span>
          </div>
          <Button type="button" variant="secondary" fullWidth loading={demoLoading} onClick={handleDemo}>
            {t("Try the demo")}
          </Button>
          <Text size="caption" tone="secondary">
            {t("Instant guest access to sample quizzes — no signup required.")}
          </Text>
          <Text size="caption" tone="secondary">
            {t("No account?")} <InlineLink to="/register">{t("Register")}</InlineLink>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}
