import { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Input,
  Stack,
  Text,
  Field,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../shell/AuthContext";
import { ApiError } from "../../lib/api";
import { localizeApiError, useT } from "../../i18n";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <Box maxW="md" mx="auto" mt={16} p={8} bg="white" rounded="lg" shadow="md">
      <Heading size="lg" mb={6}>
        {t("Sign in")}
      </Heading>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>{t("Email")}</Field.Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field.Root>
          <Field.Root>
            <Field.Label>{t("Password")}</Field.Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field.Root>
          {error && <Text color="red.500">{error}</Text>}
          <Button type="submit" colorPalette="blue" loading={loading}>
            {t("Sign in")}
          </Button>
          <Text fontSize="sm">
            {t("No account?")} <RouterLink to="/register">{t("Register")}</RouterLink>
          </Text>
        </Stack>
      </form>
    </Box>
  );
}
