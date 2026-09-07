<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'PAINT_ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$lineId = (int) ($body['line_id'] ?? 0);
$isActive = !empty($body['is_active']);

if ($lineId <= 0) {
    Response::error('line_id is required.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM paint_lines WHERE id = :id');
$stmt->execute(['id' => $lineId]);
if (!$stmt->fetch()) {
    Response::error('Paint line not found.', 404);
}

$pdo->prepare('UPDATE paint_lines SET is_active = :is_active WHERE id = :id')
    ->execute(['is_active' => $isActive ? 1 : 0, 'id' => $lineId]);

Response::ok(['line_id' => $lineId, 'is_active' => $isActive]);
