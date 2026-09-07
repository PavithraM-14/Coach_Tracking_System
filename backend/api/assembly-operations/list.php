<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

$pdo = Db::get();

$rows = $pdo->query(
    'SELECT id, code, display_name, department, sort_order FROM assembly_operations ORDER BY sort_order'
)->fetchAll();

Response::ok([
    'data' => array_map(fn ($row) => [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'display_name' => $row['display_name'],
        'department' => $row['department'],
        'sort_order' => (int) $row['sort_order'],
    ], $rows),
]);
