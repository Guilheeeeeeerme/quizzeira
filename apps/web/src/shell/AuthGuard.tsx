import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "../ui";
import { useAuth } from "./AuthContext";
import { AppShell } from "./AppShell";
import styles from "./AuthGuard.module.css";

function BootScreen() {
  return (
    <div className={styles.boot}>
      <Spinner size="lg" label="Loading session" />
    </div>
  );
}

export function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export function GuestGuard() {
  const { user, loading } = useAuth();

  if (loading) return <BootScreen />;
  if (user) return <Navigate to="/" replace />;

  return <Outlet />;
}
