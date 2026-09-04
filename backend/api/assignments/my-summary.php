<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';
require_once __DIR__ . '/../../lib/Operations.php';

$currentUser = Auth::requireRole(['FURNISHING', 'PAINT', 'ASSEMBLY_PRODUCTION', 'OUTTURN_DISPATCH']);

// A role can now cover more than one pipeline stage (PAINT does Paint In AND
// Paint Out; ASSEMBLY_PRODUCTION does Assembly In AND Assembly Out;
// OUTTURN_DISPATCH does all four final stages), so the caller must say
// which module it wants via ?module=. Falls back to that role's first/only
// module for older callers that don't pass one.
$roleModules = [
    'FURNISHING' => ['FURNISHING'],
    'PAINT' => ['PAINT', 'PAINT_OUT'],
    'ASSEMBLY_PRODUCTION' => ['ASSEMBLY_IN', 'ASSEMBLY_OUT'],
    'OUTTURN_DISPATCH' => ['LOCAL_OUTTURN', 'LOCK_SEAL', 'BOARD_OUTTURN', 'PHYSICAL_DISPATCH'],
];
$allowedForRole = $roleModules[$currentUser['role']] ?? [];
$requestedModule = trim($_GET['module'] ?? '');
$module = $requestedModule !== '' ? $requestedModule : ($allowedForRole[0] ?? '');
if (!in_array($module, $allowedForRole, true)) {
    Response::error('Invalid module for your role.', 400);
}

$pdo = Db::get();

$assignedStmt = $pdo->prepare(
    "SELECT COUNT(*) FROM coach_assignments WHERE assigned_user_id = :user_id AND module = :module AND status = 'ASSIGNED'"
);
$assignedStmt->execute(['user_id' => $currentUser['sub'], 'module' => $module]);
$assignedCount = (int) $assignedStmt->fetchColumn();

// Queued coaches this user is eligible for. PAINT/PAINT_OUT match on the
// paint_type_assignments matrix at coach-type granularity; every other
// module matches on skills/user_skills at coach-category granularity (see
// Assignment.php).
if (isset(Assignment::MATRIX_MODULES[$module])) {
    $flagColumn = Assignment::MATRIX_MODULES[$module] === 'can_out' ? 'can_out' : 'can_in';
    $queuedStmt = $pdo->prepare(
        "SELECT COUNT(DISTINCT ca.id)
         FROM coach_assignments ca
         JOIN coaches c ON c.id = ca.coach_id
         JOIN paint_type_assignments pta ON pta.user_id = :user_id AND pta.coach_type_id = c.coach_type_id AND pta.$flagColumn = 1
         WHERE ca.module = :module2 AND ca.status = 'QUEUED'"
    );
    $queuedStmt->execute(['user_id' => $currentUser['sub'], 'module2' => $module]);
} else {
    $operation = Operations::MODULE_OPERATION[$module];
    $queuedStmt = $pdo->prepare(
        "SELECT COUNT(DISTINCT ca.id)
         FROM coach_assignments ca
         JOIN coaches c ON c.id = ca.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN user_skills us ON us.user_id = :user_id
         JOIN skills s ON s.id = us.skill_id AND s.operation = :operation AND s.coach_category_id = ct.category_id
         WHERE ca.module = :module2 AND ca.status = 'QUEUED'"
    );
    $queuedStmt->execute(['user_id' => $currentUser['sub'], 'operation' => $operation, 'module2' => $module]);
}
$queuedCount = (int) $queuedStmt->fetchColumn();

Response::ok([
    'assigned_count' => $assignedCount,
    'capacity' => Assignment::capacityFor($module), // null = unlimited (FURNISHING)
    'queued_count' => $queuedCount,
]);
