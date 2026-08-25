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

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
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
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box maxW="md" mx="auto" mt={16} p={8} bg="white" rounded="lg" shadow="md">
      <Heading size="lg" mb={6}>
        Create account
      </Heading>
      <form onSubmit={handleSubmit}>
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Display name</Field.Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field.Root>
          <Field.Root>
            <Field.Label>Email</Field.Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field.Root>
          <Field.Root>
            <Field.Label>Password</Field.Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </Field.Root>
          {error && <Text color="red.500">{error}</Text>}
          <Button type="submit" colorPalette="blue" loading={loading}>
            Register
          </Button>
          <Text fontSize="sm">
            Have an account? <RouterLink to="/login">Sign in</RouterLink>
          </Text>
        </Stack>
      </form>
    </Box>
  );
}
