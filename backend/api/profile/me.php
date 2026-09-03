<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::currentUser();

$pdo = Db::get();
$stmt = $pdo->prepare(
    'SELECT u.id, u.employee_no, u.full_name, u.username, u.created_at, r.code AS role, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = :id'
);
$stmt->execute(['id' => $currentUser['sub']]);
$user = $stmt->fetch();

if (!$user) {
    Response::error('User not found.', 404);
}

$skills = [];
if (in_array($user['role'], ['FURNISHING', 'PAINT'], true)) {
    $skillStmt = $pdo->prepare(
        'SELECT s.name FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = :id ORDER BY s.name'
    );
    $skillStmt->execute(['id' => $currentUser['sub']]);
    $skills = array_column($skillStmt->fetchAll(), 'name');
}

Response::ok([
    'id' => (int) $user['id'],
    'employee_no' => $user['employee_no'],
    'full_name' => $user['full_name'],
    'username' => $user['username'],
    'role' => $user['role'],
    'role_name' => $user['role_name'],
    'created_at' => $user['created_at'],
    'skills' => $skills,
]);
