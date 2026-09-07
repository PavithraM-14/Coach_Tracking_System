<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

$pdo = Db::get();

$coachTypes = $pdo->query(
    'SELECT id, code, name FROM coach_types WHERE is_active = 1 ORDER BY sort_order, id'
)->fetchAll();

$users = $pdo->query(
    "SELECT u.id, u.employee_no, u.full_name, u.username
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE r.code = 'ASSEMBLY_PRODUCTION' AND u.is_active = 1
     ORDER BY u.id"
)->fetchAll();

$cells = $pdo->query(
    'SELECT user_id, coach_type_id, can_in, can_out FROM assembly_type_assignments'
)->fetchAll();

Response::ok([
    'coach_types' => array_map(fn ($row) => [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'name' => $row['name'],
    ], $coachTypes),
    'users' => array_map(fn ($row) => [
        'id' => (int) $row['id'],
        'employee_no' => $row['employee_no'],
        'full_name' => $row['full_name'],
        'username' => $row['username'],
    ], $users),
    'assignments' => array_map(fn ($row) => [
        'user_id' => (int) $row['user_id'],
        'coach_type_id' => (int) $row['coach_type_id'],
        'can_in' => (bool) $row['can_in'],
        'can_out' => (bool) $row['can_out'],
    ], $cells),
]);
