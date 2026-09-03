<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$email = trim((string) ($body['email'] ?? ''));

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Response::error('A valid email address is required.', 400);
}

$pdo = Db::get();
$stmt = $pdo->prepare('SELECT id, full_name FROM users WHERE email = :email AND is_active = 1');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

// Always return the same generic message whether or not the email is
// registered, so this endpoint can't be used to enumerate valid accounts.
$genericMessage = 'If that email is registered, an OTP has been sent to it.';

if ($user) {
    $recentStmt = $pdo->prepare(
        'SELECT id FROM password_resets
         WHERE user_id = :user_id AND created_at > (NOW() - INTERVAL 60 SECOND)
         ORDER BY id DESC LIMIT 1'
    );
    $recentStmt->execute(['user_id' => $user['id']]);
    if ($recentStmt->fetch()) {
        Response::error('Please wait a minute before requesting another OTP.', 429);
    }

    $otp = (string) random_int(100000, 999999);
    $expiresAt = (new DateTime('+10 minutes'))->format('Y-m-d H:i:s');

    $insert = $pdo->prepare(
        'INSERT INTO password_resets (user_id, otp_hash, expires_at) VALUES (:user_id, :otp_hash, :expires_at)'
    );
    $insert->execute([
        'user_id' => $user['id'],
        'otp_hash' => password_hash($otp, PASSWORD_BCRYPT),
        'expires_at' => $expiresAt,
    ]);

    $name = htmlspecialchars($user['full_name'], ENT_QUOTES, 'UTF-8');
    $html = "<p>Hello {$name},</p>"
        . '<p>Your one-time password to reset your Coach Tracking System account password is:</p>'
        . "<p style=\"font-size:24px;font-weight:bold;letter-spacing:4px;\">{$otp}</p>"
        . '<p>This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>';

    $sent = Mailer::send($email, 'CTS Password Reset OTP', $html);
    if (!$sent) {
        error_log("forgot_password_request: failed to email OTP to user_id={$user['id']}");
    }
}

Response::ok(['message' => $genericMessage]);
