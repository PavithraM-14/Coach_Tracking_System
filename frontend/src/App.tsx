import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminProductionOrdersPage } from "./pages/AdminProductionOrdersPage";
import { ShellProductionPage } from "./pages/ShellProductionPage";
import { ShellOutturnEntryPage } from "./pages/ShellOutturnEntryPage";
import { FurnishingInPage } from "./pages/FurnishingInPage";
import { LineManagementPage } from "./pages/LineManagementPage";
import { ProfilePage } from "./pages/ProfilePage";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminUsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/production-orders"
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AdminProductionOrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/shell-production"
                    element={
                      <ProtectedRoute allowedRoles={["SHELL_PRODUCTION"]}>
                        <ShellProductionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/shell-outturn"
                    element={
                      <ProtectedRoute allowedRoles={["SHELL_PRODUCTION"]}>
                        <ShellOutturnEntryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/furnishing-in"
                    element={
                      <ProtectedRoute allowedRoles={["FURNISHING"]}>
                        <FurnishingInPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/line-management"
                    element={
                      <ProtectedRoute allowedRoles={["PAINT", "ADMIN"]}>
                        <LineManagementPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
