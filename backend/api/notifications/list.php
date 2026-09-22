<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::currentUser();

$pdo = Db::get();

$stmt = $pdo->prepare(
    'SELECT n.id, n.type, n.coach_id, c.coach_number, n.message, n.is_read, n.created_at
     FROM notifications n
     JOIN coaches c ON c.id = n.coach_id
     WHERE n.user_id = :user_id
     ORDER BY n.created_at DESC
     LIMIT 30'
);
$stmt->execute(['user_id' => $currentUser['sub']]);
$rows = $stmt->fetchAll();

$unreadStmt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = :user_id AND is_read = 0');
$unreadStmt->execute(['user_id' => $currentUser['sub']]);
$unreadCount = (int) $unreadStmt->fetchColumn();

$data = array_map(fn ($r) => [
    'id' => (int) $r['id'],
    'type' => $r['type'],
    'coach_id' => (int) $r['coach_id'],
    'coach_number' => $r['coach_number'],
    'message' => $r['message'],
    'is_read' => (bool) $r['is_read'],
    'created_at' => $r['created_at'],
], $rows);

Response::ok(['data' => $data, 'unread_count' => $unreadCount]);
