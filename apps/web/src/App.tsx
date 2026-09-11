import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./shell/AuthContext";
import { AuthGuard, GuestGuard } from "./shell/AuthGuard";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { ExamsPage } from "./features/exams/ExamsPage";
import { TopicsPage } from "./features/topics/TopicsPage";
import { TopicEditorPage } from "./features/topics/TopicEditorPage";
import { StudyFocusPage } from "./features/topics/StudyFocusPage";
import { QuizPage } from "./features/quiz/QuizPage";
import { ResultsPage } from "./features/quiz/ResultsPage";
import { ProgressPage } from "./features/quiz/ProgressPage";
import {
  AdminExamsPage,
  AdminHealthPage,
  AdminLayout,
  AdminQualityPage,
  AdminSourcesPage,
} from "./features/admin/AdminPages";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<GuestGuard />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<AuthGuard />}>
            <Route path="/" element={<ExamsPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/topics/new" element={<Navigate to="/" replace />} />
            <Route path="/topics/:topicId" element={<TopicEditorPage />} />
            <Route path="/topics/:topicId/study" element={<StudyFocusPage />} />
            <Route path="/quiz/:attemptId" element={<QuizPage />} />
            <Route path="/results/:attemptId" element={<ResultsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route
              path="/admin"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<Navigate to="sources" replace />} />
              <Route path="sources" element={<AdminSourcesPage />} />
              <Route path="exams" element={<AdminExamsPage />} />
              <Route path="quality" element={<AdminQualityPage />} />
              <Route path="health" element={<AdminHealthPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
