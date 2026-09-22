<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

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

$stmt = $pdo->prepare(
    'SELECT s.id, s.slot_number, al.name AS line_name
     FROM assembly_in_line_slots s JOIN assembly_in_lines al ON al.id = s.assembly_in_line_id
     WHERE s.id = :id'
);
$stmt->execute(['id' => $slotId]);
$slot = $stmt->fetch();
if (!$slot) {
    Response::error('Assembly In line slot not found.', 404);
}

$pdo->prepare('UPDATE assembly_in_line_slots SET is_active = :is_active WHERE id = :id')
    ->execute(['is_active' => $isActive ? 1 : 0, 'id' => $slotId]);
BlockLog::record($pdo, 'ASSEMBLY_SLOT', "{$slot['line_name']}, Slot {$slot['slot_number']}", $isActive, (int) $currentUser['sub']);

Response::ok(['slot_id' => $slotId, 'is_active' => $isActive]);
