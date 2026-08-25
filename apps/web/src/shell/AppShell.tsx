import { Box, Container, Flex, Heading, Button, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <Box minH="100vh" bg="gray.50">
      <Box as="header" bg="white" borderBottomWidth="1px" shadow="sm">
        <Container maxW="container.lg" py={4}>
          <Flex align="center" justify="space-between" gap={4}>
            <Heading size="md">
              <RouterLink to="/">AI Dev Quiz</RouterLink>
            </Heading>
            <Flex align="center" gap={4}>
              <RouterLink to="/progress">Progress</RouterLink>
              {user && (
                <Text fontSize="sm" color="gray.600">
                  {user.displayName ?? user.email}
                </Text>
              )}
              <Button size="sm" variant="outline" onClick={() => void logout()}>
                Log out
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>
      <Container maxW="container.lg">{children}</Container>
    </Box>
  );
}
