<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

$pdo = Db::get();

$coaches = $pdo->query(
    'SELECT c.id, c.coach_number, ct.name AS coach_type
     FROM coaches c
     JOIN coach_types ct ON ct.id = c.coach_type_id
     ORDER BY c.coach_number'
)->fetchAll();

$operations = $pdo->query(
    'SELECT id, code, display_name, department, sort_order FROM assembly_operations ORDER BY sort_order'
)->fetchAll();

$exclusions = $pdo->query(
    'SELECT coach_id, operation_id FROM assembly_operation_exclusions'
)->fetchAll();

Response::ok([
    'coaches' => array_map(fn ($row) => [
        'id' => (int) $row['id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
    ], $coaches),
    'operations' => array_map(fn ($row) => [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'display_name' => $row['display_name'],
        'department' => $row['department'],
        'sort_order' => (int) $row['sort_order'],
    ], $operations),
    'exclusions' => array_map(fn ($row) => [
        'coach_id' => (int) $row['coach_id'],
        'operation_id' => (int) $row['operation_id'],
    ], $exclusions),
]);
