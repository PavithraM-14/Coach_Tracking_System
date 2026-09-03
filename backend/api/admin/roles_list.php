<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();
$rows = $pdo->query('SELECT id, code, name FROM roles ORDER BY name')->fetchAll();

$data = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'name' => $row['name'],
    ];
}, $rows);

Response::ok(['data' => $data]);
