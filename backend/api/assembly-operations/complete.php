<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$assemblyInId = (int) ($body['assembly_in_id'] ?? 0);
$operationIds = is_array($body['operation_ids'] ?? null) ? array_map('intval', $body['operation_ids']) : [];

if ($assemblyInId <= 0) {
    Response::error('assembly_in_id is required.', 400);
}
if (empty($operationIds)) {
    Response::error('Select at least one operation to complete.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id, coach_id FROM assembly_in_transactions WHERE id = :id');
$stmt->execute(['id' => $assemblyInId]);
$assemblyIn = $stmt->fetch();
if (!$assemblyIn) {
    Response::error('Assembly In record not found.', 404);
}
$coachId = (int) $assemblyIn['coach_id'];

$alreadyOut = $pdo->prepare('SELECT id FROM assembly_out_transactions WHERE assembly_in_id = :id');
$alreadyOut->execute(['id' => $assemblyInId]);
if ($alreadyOut->fetch()) {
    Response::error('Assembly Out has already been recorded for this coach.', 409);
}

// This worker's assigned operations (via skills matching their own role).
$assignedStmt = $pdo->prepare(
    "SELECT ao.id AS operation_id
     FROM user_skills us
     JOIN skills sk ON sk.id = us.skill_id AND sk.role_code = :role_code
     JOIN assembly_operations ao ON ao.code = sk.operation
     WHERE us.user_id = :user_id"
);
$assignedStmt->execute(['user_id' => $currentUser['sub'], 'role_code' => $currentUser['role']]);
$assignedIds = array_map('intval', array_column($assignedStmt->fetchAll(), 'operation_id'));

// Operations excluded (don't apply) for this specific coach.
$excludedStmt = $pdo->prepare('SELECT operation_id FROM assembly_operation_exclusions WHERE coach_id = :coach_id');
$excludedStmt->execute(['coach_id' => $coachId]);
$excludedIds = array_map('intval', array_column($excludedStmt->fetchAll(), 'operation_id'));

// Operations already completed for this Assembly In visit.
$doneStmt = $pdo->prepare('SELECT operation_id FROM assembly_operation_completions WHERE assembly_in_id = :assembly_in_id');
$doneStmt->execute(['assembly_in_id' => $assemblyInId]);
$doneIds = array_map('intval', array_column($doneStmt->fetchAll(), 'operation_id'));

$toComplete = [];
foreach (array_unique($operationIds) as $operationId) {
    if (!in_array($operationId, $assignedIds, true)) {
        Response::error("Operation {$operationId} is not assigned to you.", 403);
    }
    if (in_array($operationId, $excludedIds, true)) {
        Response::error("Operation {$operationId} does not apply to this coach.", 400);
    }
    if (!in_array($operationId, $doneIds, true)) {
        $toComplete[] = $operationId;
    }
}

if (empty($toComplete)) {
    Response::ok(['completed' => 0, 'assembly_out_queued' => false]);
}

$pdo->beginTransaction();
try {
    $insert = $pdo->prepare(
        'INSERT INTO assembly_operation_completions (assembly_in_id, operation_id, coach_id, completed_by_user_id, completed_at)
         VALUES (:assembly_in_id, :operation_id, :coach_id, :completed_by_user_id, :completed_at)'
    );
    $now = date('Y-m-d H:i:s');
    foreach ($toComplete as $operationId) {
        $insert->execute([
            'assembly_in_id' => $assemblyInId,
            'operation_id' => $operationId,
            'coach_id' => $coachId,
            'completed_by_user_id' => $currentUser['sub'],
            'completed_at' => $now,
        ]);
    }

    // Gate: once every operation that applies to this coach has been
    // completed for this Assembly In visit, queue it for Assembly Out.
    $totalRequired = (int) $pdo->query('SELECT COUNT(*) FROM assembly_operations')->fetchColumn() - count($excludedIds);
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM assembly_operation_completions WHERE assembly_in_id = :id');
    $countStmt->execute(['id' => $assemblyInId]);
    $totalCompleted = (int) $countStmt->fetchColumn();

    $queued = false;
    if ($totalRequired > 0 && $totalCompleted >= $totalRequired) {
        $existing = $pdo->prepare("SELECT id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'ASSEMBLY_OUT'");
        $existing->execute(['coach_id' => $coachId]);
        if (!$existing->fetch()) {
            Assignment::assignOrQueue($pdo, $coachId, 'ASSEMBLY_OUT');
            $queued = true;
        }
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to complete operations: ' . $e->getMessage(), 500);
}

Response::ok(['completed' => count($toComplete), 'assembly_out_queued' => $queued]);
