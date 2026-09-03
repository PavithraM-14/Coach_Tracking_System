<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT s.id, s.name, s.operation, s.role_code, cc.id AS coach_category_id, cc.name AS coach_category_name
     FROM skills s
     JOIN coach_categories cc ON cc.id = s.coach_category_id
     ORDER BY s.operation, cc.name"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'operation' => $row['operation'],
        'role_code' => $row['role_code'],
        'coach_category_id' => (int) $row['coach_category_id'],
        'coach_category_name' => $row['coach_category_name'],
    ];
}, $rows);

Response::ok(['data' => $data]);
