<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ADMIN', 'PAINT_ADMIN', 'ASSEMBLY_ADMIN']);

$pdo = Db::get();

// Paint Admin / Assembly Admin only ever create logins for their own shop's
// workers — Admin creates every other role, including these two admin
// roles themselves, but no longer PAINT/ASSEMBLY_PRODUCTION directly.
if ($currentUser['role'] === 'PAINT_ADMIN') {
    $rows = $pdo->query("SELECT id, code, name FROM roles WHERE code = 'PAINT'")->fetchAll();
} elseif ($currentUser['role'] === 'ASSEMBLY_ADMIN') {
    $rows = $pdo->query("SELECT id, code, name FROM roles WHERE code = 'ASSEMBLY_PRODUCTION'")->fetchAll();
} else {
    $rows = $pdo->query(
        "SELECT id, code, name FROM roles WHERE code NOT IN ('PAINT', 'ASSEMBLY_PRODUCTION') ORDER BY name"
    )->fetchAll();
}

$data = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        'code' => $row['code'],
        'name' => $row['name'],
    ];
}, $rows);

Response::ok(['data' => $data]);
