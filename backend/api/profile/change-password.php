<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::currentUser();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$currentPassword = (string) ($body['current_password'] ?? '');
$newPassword = (string) ($body['new_password'] ?? '');

if ($currentPassword === '' || $newPassword === '') {
    Response::error('Current password and new password are required.', 400);
}
if (strlen($newPassword) < 6) {
    Response::error('New password must be at least 6 characters.', 400);
}

$pdo = Db::get();
$stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id');
$stmt->execute(['id' => $currentUser['sub']]);
$user = $stmt->fetch();

if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
    Response::error('Current password is incorrect.', 401);
}

$update = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id');
$update->execute([
    'hash' => password_hash($newPassword, PASSWORD_BCRYPT),
    'id' => $currentUser['sub'],
]);

Response::ok(['message' => 'Password updated.']);
