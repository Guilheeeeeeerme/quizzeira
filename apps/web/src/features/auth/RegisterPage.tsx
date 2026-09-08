import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shell/AuthContext";
import { AuthLayout } from "../../shell/AuthLayout";
import { ApiError } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";
import { Button, Field, InlineLink, Input, Stack, Text } from "../../ui";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, displayName || undefined);
      navigate("/");
    } catch (err: unknown) {
      setError(localizeApiError(err instanceof ApiError ? err.message : "Registration failed", t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("Create account")} subtitle={t("Pick an open exam and start a study pill.")}>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field label={t("Display name")} htmlFor="register-name">
            <Input
              id="register-name"
              autoComplete="nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
          <Field label={t("Email")} htmlFor="register-email">
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              invalid={Boolean(error)}
            />
          </Field>
          <Field label={t("Password")} htmlFor="register-password" hint={t("At least 6 characters")}>
            <Input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              invalid={Boolean(error)}
            />
          </Field>
          {error ? (
            <Text tone="danger" size="caption" role="alert">
              {error}
            </Text>
          ) : null}
          <Button type="submit" fullWidth loading={loading}>
            {t("Register")}
          </Button>
          <Text size="caption" tone="secondary">
            {t("Have an account?")} <InlineLink to="/login">{t("Sign in")}</InlineLink>
          </Text>
        </Stack>
      </form>
    </AuthLayout>
  );
}
