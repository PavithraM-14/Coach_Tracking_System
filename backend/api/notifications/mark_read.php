<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::currentUser();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$id = isset($body['id']) ? (int) $body['id'] : null;

$pdo = Db::get();

if ($id !== null) {
    $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = :id AND user_id = :user_id')
        ->execute(['id' => $id, 'user_id' => $currentUser['sub']]);
} else {
    $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = :user_id')
        ->execute(['user_id' => $currentUser['sub']]);
}

Response::ok(['ok' => true]);
