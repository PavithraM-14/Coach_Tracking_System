<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$slotId = (int) ($body['slot_id'] ?? 0);
$isActive = !empty($body['is_active']);

if ($slotId <= 0) {
    Response::error('slot_id is required.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM assembly_in_line_slots WHERE id = :id');
$stmt->execute(['id' => $slotId]);
if (!$stmt->fetch()) {
    Response::error('Assembly In line slot not found.', 404);
}

$pdo->prepare('UPDATE assembly_in_line_slots SET is_active = :is_active WHERE id = :id')
    ->execute(['is_active' => $isActive ? 1 : 0, 'id' => $slotId]);

Response::ok(['slot_id' => $slotId, 'is_active' => $isActive]);
