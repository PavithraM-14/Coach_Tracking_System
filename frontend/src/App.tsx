import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { WelcomePage } from "./pages/WelcomePage";
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
import { PendingCoachesPage } from "./pages/PendingCoachesPage";
import { getFurnishingInWorklist } from "./api/furnishingIn";
import { getPaintInWorklist } from "./api/paintIn";
import { getPaintOutWorklist } from "./api/paintOut";
import { getAssemblyInWorklist } from "./api/assemblyIn";
import { getAssemblyOutWorklist } from "./api/assemblyOut";
import { getLocalOutturnWorklist } from "./api/localOutturn";
import { getLockSealWorklist } from "./api/lockSeal";
import { getBoardOutturnWorklist } from "./api/boardOutturn";
import { getPhysicalDispatchWorklist } from "./api/physicalDispatch";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
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
                    path="/furnishing-in/pending"
                    element={
                      <ProtectedRoute allowedRoles={["FURNISHING"]} requiredModule="FURNISHING">
                        <PendingCoachesPage
                          title="Furnishing In — Pending"
                          description="Coaches with Shell Outturn recorded, awaiting Furnishing In."
                          emptyMessage="No coaches pending Furnishing In."
                          fetchWorklist={getFurnishingInWorklist}
                        />
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
                    path="/paint-in/pending"
                    element={
                      <ProtectedRoute allowedRoles={["PAINT"]} requiredModule="PAINT">
                        <PendingCoachesPage
                          title="Paint In — Pending"
                          description="Coaches with Furnishing In recorded, awaiting Paint In."
                          emptyMessage="No coaches pending Paint In."
                          fetchWorklist={getPaintInWorklist}
                        />
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
                    path="/paint-out/pending"
                    element={
                      <ProtectedRoute allowedRoles={["PAINT"]} requiredModule="PAINT_OUT">
                        <PendingCoachesPage
                          title="Paint Out — Pending"
                          description="Coaches with Paint In recorded, awaiting Paint Out."
                          emptyMessage="No coaches pending Paint Out."
                          fetchWorklist={getPaintOutWorklist}
                        />
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
                    path="/assembly-in/pending"
                    element={
                      <ProtectedRoute allowedRoles={["ASSEMBLY_PRODUCTION"]} requiredModule="ASSEMBLY_IN">
                        <PendingCoachesPage
                          title="Assembly In — Pending"
                          description="Coaches with Paint Out recorded, awaiting Assembly In."
                          emptyMessage="No coaches pending Assembly In."
                          fetchWorklist={getAssemblyInWorklist}
                        />
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
                    path="/assembly-out/pending"
                    element={
                      <ProtectedRoute allowedRoles={["ASSEMBLY_PRODUCTION"]} requiredModule="ASSEMBLY_OUT">
                        <PendingCoachesPage
                          title="Assembly Out — Pending"
                          description="Coaches with Assembly In recorded, awaiting Assembly Out."
                          emptyMessage="No coaches pending Assembly Out."
                          fetchWorklist={getAssemblyOutWorklist}
                        />
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
                    path="/local-outturn/pending"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="LOCAL_OUTTURN">
                        <PendingCoachesPage
                          title="Local Outturn — Pending"
                          description="Coaches with Assembly Out recorded, awaiting Local Outturn."
                          emptyMessage="No coaches pending Local Outturn."
                          fetchWorklist={getLocalOutturnWorklist}
                        />
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
                    path="/lock-seal/pending"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="LOCK_SEAL">
                        <PendingCoachesPage
                          title="Lock & Seal — Pending"
                          description="Coaches with Local Outturn recorded, awaiting Lock & Seal."
                          emptyMessage="No coaches pending Lock & Seal."
                          fetchWorklist={getLockSealWorklist}
                        />
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
                    path="/board-outturn/pending"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="BOARD_OUTTURN">
                        <PendingCoachesPage
                          title="Railway Board Outturn — Pending"
                          description="Coaches with Lock & Seal recorded, awaiting Railway Board Outturn."
                          emptyMessage="No coaches pending Railway Board Outturn."
                          fetchWorklist={getBoardOutturnWorklist}
                        />
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
                    path="/physical-dispatch/pending"
                    element={
                      <ProtectedRoute allowedRoles={["OUTTURN_DISPATCH"]} requiredModule="PHYSICAL_DISPATCH">
                        <PendingCoachesPage
                          title="Physical Dispatch — Pending"
                          description="Coaches with Railway Board Outturn recorded, awaiting Physical Dispatch."
                          emptyMessage="No coaches pending Physical Dispatch."
                          fetchWorklist={getPhysicalDispatchWorklist}
                        />
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
