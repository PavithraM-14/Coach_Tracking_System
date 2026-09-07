<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION']);

$pdo = Db::get();

$stmt = $pdo->prepare(
    'SELECT aoc.id, aoc.coach_id, c.coach_number, aoc.operation_id, ao.display_name, aoc.completed_at
     FROM assembly_operation_completions aoc
     JOIN coaches c ON c.id = aoc.coach_id
     JOIN assembly_operations ao ON ao.id = aoc.operation_id
     WHERE aoc.completed_by_user_id = :user_id
     ORDER BY aoc.completed_at DESC'
);
$stmt->execute(['user_id' => $currentUser['sub']]);
$rows = $stmt->fetchAll();

Response::ok([
    'data' => array_map(fn ($row) => [
        'id' => (int) $row['id'],
        'coach_id' => (int) $row['coach_id'],
        'coach_number' => $row['coach_number'],
        'operation_id' => (int) $row['operation_id'],
        'display_name' => $row['display_name'],
        'completed_at' => $row['completed_at'],
    ], $rows),
]);
