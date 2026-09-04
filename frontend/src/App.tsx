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
import { ShellOutturnHistoryPage } from "./pages/ShellOutturnHistoryPage";
import { FurnishingInPage } from "./pages/FurnishingInPage";
import { FurnishingInHistoryPage } from "./pages/FurnishingInHistoryPage";
import { LineManagementPage } from "./pages/LineManagementPage";
import { PaintInPage } from "./pages/PaintInPage";
import { PaintInHistoryPage } from "./pages/PaintInHistoryPage";
import { PaintOutPage } from "./pages/PaintOutPage";
import { PaintOutHistoryPage } from "./pages/PaintOutHistoryPage";
import { AssemblyInPage } from "./pages/AssemblyInPage";
import { AssemblyInHistoryPage } from "./pages/AssemblyInHistoryPage";
import { AssemblyOutPage } from "./pages/AssemblyOutPage";
import { AssemblyOutHistoryPage } from "./pages/AssemblyOutHistoryPage";
import { PaintAssignmentMatrixPage } from "./pages/PaintAssignmentMatrixPage";
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
                    path="/shell-outturn/history"
                    element={
                      <ProtectedRoute allowedRoles={["SHELL_PRODUCTION"]}>
                        <ShellOutturnHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/furnishing-in"
                    element={
                      <ProtectedRoute allowedRoles={["FURNISHING"]} requiredModule="FURNISHING">
                        <FurnishingInPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/furnishing-in/history"
                    element={
                      <ProtectedRoute allowedRoles={["FURNISHING"]}>
                        <FurnishingInHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/line-management"
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <LineManagementPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/paint-in"
                    element={
                      <ProtectedRoute allowedRoles={["PAINT"]} requiredModule="PAINT">
                        <PaintInPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/paint-in/history"
                    element={
                      <ProtectedRoute allowedRoles={["PAINT", "ADMIN"]}>
                        <PaintInHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/paint-assignments"
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <PaintAssignmentMatrixPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/paint-out"
                    element={
                      <ProtectedRoute allowedRoles={["PAINT"]} requiredModule="PAINT_OUT">
                        <PaintOutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/paint-out/history"
                    element={
                      <ProtectedRoute allowedRoles={["PAINT", "ADMIN"]}>
                        <PaintOutHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assembly-in"
                    element={
                      <ProtectedRoute allowedRoles={["ASSEMBLY_PRODUCTION"]} requiredModule="ASSEMBLY_IN">
                        <AssemblyInPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assembly-in/history"
                    element={
                      <ProtectedRoute allowedRoles={["ASSEMBLY_PRODUCTION", "ADMIN"]}>
                        <AssemblyInHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assembly-out"
                    element={
                      <ProtectedRoute allowedRoles={["ASSEMBLY_PRODUCTION"]} requiredModule="ASSEMBLY_OUT">
                        <AssemblyOutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/assembly-out/history"
                    element={
                      <ProtectedRoute allowedRoles={["ASSEMBLY_PRODUCTION", "ADMIN"]}>
                        <AssemblyOutHistoryPage />
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
