<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION']);

$pdo = Db::get();

// Coaches currently "at Assembly In" (no Assembly Out yet) where at least
// one operation is (a) assigned to this worker, (b) applicable to the coach
// (not excluded), and (c) not yet completed for this Assembly In visit.
// A worker's skills always match their own role (see user_skills_update.php).
$stmt = $pdo->prepare(
    'SELECT ait.id AS assembly_in_id, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
            ao.id AS operation_id, ao.code, ao.display_name
     FROM assembly_in_transactions ait
     JOIN coaches c ON c.id = ait.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN user_skills us ON us.user_id = :user_id
     JOIN skills sk ON sk.id = us.skill_id AND sk.role_code = :role_code
     JOIN assembly_operations ao ON ao.code = sk.operation
     LEFT JOIN assembly_out_transactions aot ON aot.assembly_in_id = ait.id
     LEFT JOIN assembly_operation_exclusions aoe ON aoe.coach_id = c.id AND aoe.operation_id = ao.id
     LEFT JOIN assembly_operation_completions aoc ON aoc.assembly_in_id = ait.id AND aoc.operation_id = ao.id
     WHERE aot.id IS NULL AND aoe.coach_id IS NULL AND aoc.id IS NULL
     ORDER BY c.coach_number, ao.sort_order'
);
$stmt->execute(['user_id' => $currentUser['sub'], 'role_code' => $currentUser['role']]);
$rows = $stmt->fetchAll();

$byCoach = [];
foreach ($rows as $row) {
    $assemblyInId = (int) $row['assembly_in_id'];
    if (!isset($byCoach[$assemblyInId])) {
        $byCoach[$assemblyInId] = [
            'assembly_in_id' => $assemblyInId,
            'coach_id' => (int) $row['coach_id'],
            'coach_number' => $row['coach_number'],
            'coach_type' => $row['coach_type'],
            'pending_operations' => [],
        ];
    }
    $byCoach[$assemblyInId]['pending_operations'][] = [
        'id' => (int) $row['operation_id'],
        'code' => $row['code'],
        'display_name' => $row['display_name'],
    ];
}

Response::ok(['data' => array_values($byCoach)]);
