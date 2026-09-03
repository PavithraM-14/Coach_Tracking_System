<?php

require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$username = trim($body['username'] ?? '');
$password = (string) ($body['password'] ?? '');

if ($username === '' || $password === '') {
    Response::error('Username and password are required.', 400);
}

$pdo = Db::get();
$stmt = $pdo->prepare(
    'SELECT u.id, u.employee_no, u.full_name, u.username, u.password_hash, u.is_active, r.code AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.username = :username
     LIMIT 1'
);
$stmt->execute(['username' => $username]);
$user = $stmt->fetch();

// Always run password_verify, even for a nonexistent user (against a dummy hash),
// so response timing doesn't reveal whether a username exists.
$hashToVerify = $user ? $user['password_hash'] : '$2y$10$THqWgtzZXDK8TD3DFTQmt.ZN1PTXY/d/ZR2MV3Jw1Vvat.e/5THU.';
$passwordOk = password_verify($password, $hashToVerify);

if (!$user || !$user['is_active'] || !$passwordOk) {
    Response::error('Invalid username or password', 401);
}

$token = Auth::issueToken([
    'sub' => (int) $user['id'],
    'employee_no' => $user['employee_no'],
    'full_name' => $user['full_name'],
    'username' => $user['username'],
    'role' => $user['role'],
]);

Response::ok([
    'token' => $token,
    'user' => [
        'id' => (int) $user['id'],
        'employee_no' => $user['employee_no'],
        'full_name' => $user['full_name'],
        'username' => $user['username'],
        'role' => $user['role'],
    ],
]);
