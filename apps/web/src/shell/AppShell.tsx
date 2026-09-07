import { Box, Container, Flex, Heading, Button, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { SUPPORTED_LOCALES, useLocale, useT } from "../i18n";
import type { Locale } from "../i18n";

const localeLabels: Record<Locale, string> = {
  en: "English",
  "pt-BR": "Português (BR)",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = useT();

  return (
    <Box minH="100vh" bg="gray.50">
      <Box as="header" bg="white" borderBottomWidth="1px" shadow="sm">
        <Container maxW="container.lg" py={4}>
          <Flex align="center" justify="space-between" gap={4}>
            <Heading size="md">
              <RouterLink to="/">{t("AI Dev Quiz")}</RouterLink>
            </Heading>
            <Flex align="center" gap={4}>
              <RouterLink to="/progress">{t("Progress")}</RouterLink>
              <Flex align="center" gap={1}>
                {SUPPORTED_LOCALES.map((code) => (
                  <Button
                    key={code}
                    size="xs"
                    variant={locale === code ? "solid" : "outline"}
                    colorPalette={locale === code ? "blue" : "gray"}
                    aria-pressed={locale === code}
                    onClick={() => setLocale(code)}
                  >
                    {localeLabels[code]}
                  </Button>
                ))}
              </Flex>
              {user && (
                <Text fontSize="sm" color="gray.600">
                  {user.displayName ?? user.email}
                </Text>
              )}
              <Button size="sm" variant="outline" onClick={() => void logout()}>
                {t("Log out")}
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>
      <Container maxW="container.lg">{children}</Container>
    </Box>
  );
}
