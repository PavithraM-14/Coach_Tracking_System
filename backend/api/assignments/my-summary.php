<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['FURNISHING', 'PAINT']);
$module = $currentUser['role']; // FURNISHING or PAINT

$pdo = Db::get();

$assignedStmt = $pdo->prepare(
    "SELECT COUNT(*) FROM coach_assignments WHERE assigned_user_id = :user_id AND module = :module AND status = 'ASSIGNED'"
);
$assignedStmt->execute(['user_id' => $currentUser['sub'], 'module' => $module]);
$assignedCount = (int) $assignedStmt->fetchColumn();

// Queued coaches whose category matches at least one of this user's skills for this module.
$queuedStmt = $pdo->prepare(
    "SELECT COUNT(DISTINCT ca.id)
     FROM coach_assignments ca
     JOIN coaches c ON c.id = ca.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN user_skills us ON us.user_id = :user_id
     JOIN skills s ON s.id = us.skill_id AND s.role_code = :module AND s.coach_category_id = ct.category_id
     WHERE ca.module = :module2 AND ca.status = 'QUEUED'"
);
$queuedStmt->execute(['user_id' => $currentUser['sub'], 'module' => $module, 'module2' => $module]);
$queuedCount = (int) $queuedStmt->fetchColumn();

Response::ok([
    'assigned_count' => $assignedCount,
    'capacity' => Assignment::MAX_CONCURRENT,
    'queued_count' => $queuedCount,
]);
