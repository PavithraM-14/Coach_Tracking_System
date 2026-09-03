<?php

require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$email = trim((string) ($body['email'] ?? ''));
$resetToken = trim((string) ($body['reset_token'] ?? ''));
$newPassword = (string) ($body['new_password'] ?? '');

if ($email === '' || $resetToken === '' || $newPassword === '') {
    Response::error('Email, reset token and new password are required.', 400);
}
if (strlen($newPassword) < 6) {
    Response::error('Password must be at least 6 characters.', 400);
}

$pdo = Db::get();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email AND is_active = 1');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    Response::error('Invalid or expired reset request.', 400);
}

$resetStmt = $pdo->prepare(
    'SELECT id, expires_at FROM password_resets
     WHERE user_id = :user_id AND reset_token = :token AND verified_at IS NOT NULL AND consumed_at IS NULL
     ORDER BY id DESC LIMIT 1'
);
$resetStmt->execute(['user_id' => $user['id'], 'token' => $resetToken]);
$reset = $resetStmt->fetch();

if (!$reset || strtotime($reset['expires_at']) < time()) {
    Response::error('Invalid or expired reset request. Please request a new OTP.', 400);
}

$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id = :id')
        ->execute(['hash' => password_hash($newPassword, PASSWORD_BCRYPT), 'id' => $user['id']]);
    $pdo->prepare('UPDATE password_resets SET consumed_at = NOW() WHERE id = :id')
        ->execute(['id' => $reset['id']]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to reset password: ' . $e->getMessage(), 500);
}

Response::ok(['message' => 'Password has been reset successfully.']);
