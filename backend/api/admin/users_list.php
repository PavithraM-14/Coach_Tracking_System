<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();
$rows = $pdo->query(
    'SELECT u.id, u.employee_no, u.full_name, u.username, u.is_active, u.created_at, r.code AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     ORDER BY u.created_at DESC'
)->fetchAll();

$skillRows = $pdo->query(
    'SELECT us.user_id, s.id AS skill_id, s.name
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id'
)->fetchAll();

$skillsByUser = [];
foreach ($skillRows as $row) {
    $skillsByUser[(int) $row['user_id']][] = ['id' => (int) $row['skill_id'], 'name' => $row['name']];
}

$data = array_map(function ($row) use ($skillsByUser) {
    return [
        'id' => (int) $row['id'],
        'employee_no' => $row['employee_no'],
        'full_name' => $row['full_name'],
        'username' => $row['username'],
        'role' => $row['role'],
        'is_active' => (bool) $row['is_active'],
        'created_at' => $row['created_at'],
        'skills' => $skillsByUser[(int) $row['id']] ?? [],
    ];
}, $rows);

Response::ok(['data' => $data]);
