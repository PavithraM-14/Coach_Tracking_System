<?php

require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$email = trim((string) ($body['email'] ?? ''));
$otp = trim((string) ($body['otp'] ?? ''));

if ($email === '' || $otp === '') {
    Response::error('Email and OTP are required.', 400);
}

$pdo = Db::get();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email AND is_active = 1');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user) {
    Response::error('Invalid or expired OTP.', 400);
}

$resetStmt = $pdo->prepare(
    'SELECT id, otp_hash, attempts, expires_at FROM password_resets
     WHERE user_id = :user_id AND consumed_at IS NULL
     ORDER BY id DESC LIMIT 1'
);
$resetStmt->execute(['user_id' => $user['id']]);
$reset = $resetStmt->fetch();

if (!$reset || strtotime($reset['expires_at']) < time()) {
    Response::error('Invalid or expired OTP.', 400);
}

if ((int) $reset['attempts'] >= 5) {
    Response::error('Too many attempts. Please request a new OTP.', 429);
}

if (!password_verify($otp, $reset['otp_hash'])) {
    $pdo->prepare('UPDATE password_resets SET attempts = attempts + 1 WHERE id = :id')
        ->execute(['id' => $reset['id']]);
    Response::error('Invalid or expired OTP.', 400);
}

$resetToken = bin2hex(random_bytes(32));
$pdo->prepare('UPDATE password_resets SET verified_at = NOW(), reset_token = :token WHERE id = :id')
    ->execute(['token' => $resetToken, 'id' => $reset['id']]);

Response::ok(['reset_token' => $resetToken]);
