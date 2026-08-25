import { Navigate, Outlet } from "react-router-dom";
import { Box, Spinner, Center } from "@chakra-ui/react";
import { useAuth } from "./AuthContext";
import { AppShell } from "./AppShell";

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Box py={6}>
        <Outlet />
      </Box>
    </AppShell>
  );
}

export function GuestGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center minH="100vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
