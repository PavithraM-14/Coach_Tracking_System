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
import { AssemblyAssignmentMatrixPage } from "./pages/AssemblyAssignmentMatrixPage";
import { CoachDetailPage } from "./pages/CoachDetailPage";
import { LocalOutturnPage } from "./pages/LocalOutturnPage";
import { LocalOutturnHistoryPage } from "./pages/LocalOutturnHistoryPage";
import { LockSealPage } from "./pages/LockSealPage";
import { LockSealHistoryPage } from "./pages/LockSealHistoryPage";
import { BoardOutturnPage } from "./pages/BoardOutturnPage";
import { BoardOutturnHistoryPage } from "./pages/BoardOutturnHistoryPage";
import { PhysicalDispatchPage } from "./pages/PhysicalDispatchPage";
import { PhysicalDispatchHistoryPage } from "./pages/PhysicalDispatchHistoryPage";
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
                    path="/admin/assembly-assignments"
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <AssemblyAssignmentMatrixPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/coaches/:coachId"
                    element={
                      <ProtectedRoute allowedRoles={["ADMIN"]}>
                        <CoachDetailPage />
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
                  <Route
                    path="/local-outturn"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="LOCAL_OUTTURN">
                        <LocalOutturnPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/local-outturn/history"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH", "ADMIN"]}>
                        <LocalOutturnHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lock-seal"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="LOCK_SEAL">
                        <LockSealPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/lock-seal/history"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH", "ADMIN"]}>
                        <LockSealHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/board-outturn"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="BOARD_OUTTURN">
                        <BoardOutturnPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/board-outturn/history"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH", "ADMIN"]}>
                        <BoardOutturnHistoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/physical-dispatch"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="PHYSICAL_DISPATCH">
                        <PhysicalDispatchPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/physical-dispatch/history"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH", "ADMIN"]}>
                        <PhysicalDispatchHistoryPage />
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
