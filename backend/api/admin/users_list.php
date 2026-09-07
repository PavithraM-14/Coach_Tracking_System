<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ADMIN', 'PAINT_ADMIN', 'ASSEMBLY_ADMIN']);

$pdo = Db::get();

// Paint Admin / Assembly Admin only ever see the workers they manage; Admin
// keeps full read-only visibility across every role, including these two.
$scopedRole = null;
if ($currentUser['role'] === 'PAINT_ADMIN') {
    $scopedRole = 'PAINT';
} elseif ($currentUser['role'] === 'ASSEMBLY_ADMIN') {
    $scopedRole = 'ASSEMBLY_PRODUCTION';
}

$sql = 'SELECT u.id, u.employee_no, u.full_name, u.username, u.email, u.is_active, u.created_at, r.code AS role
        FROM users u
        JOIN roles r ON r.id = u.role_id';
if ($scopedRole !== null) {
    $sql .= ' WHERE r.code = :scoped_role';
}
$sql .= ' ORDER BY u.created_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($scopedRole !== null ? ['scoped_role' => $scopedRole] : []);
$rows = $stmt->fetchAll();

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
        'email' => $row['email'],
        'role' => $row['role'],
        'is_active' => (bool) $row['is_active'],
        'created_at' => $row['created_at'],
        'skills' => $skillsByUser[(int) $row['id']] ?? [],
    ];
}, $rows);

Response::ok(['data' => $data]);
