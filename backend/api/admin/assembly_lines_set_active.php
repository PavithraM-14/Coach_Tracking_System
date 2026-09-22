<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

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

$stmt = $pdo->prepare('SELECT id, name FROM assembly_in_lines WHERE id = :id');
$stmt->execute(['id' => $lineId]);
$line = $stmt->fetch();
if (!$line) {
    Response::error('Assembly In line not found.', 404);
}

$pdo->prepare('UPDATE assembly_in_lines SET is_active = :is_active WHERE id = :id')
    ->execute(['is_active' => $isActive ? 1 : 0, 'id' => $lineId]);
BlockLog::record($pdo, 'ASSEMBLY_LINE', $line['name'], $isActive, (int) $currentUser['sub']);

Response::ok(['line_id' => $lineId, 'is_active' => $isActive]);
