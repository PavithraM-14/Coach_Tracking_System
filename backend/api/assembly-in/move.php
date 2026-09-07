<?php

require_once __DIR__ . '/../../bootstrap.php';

// Only Assembly employees move coaches between slots day-to-day — Assembly
// Admin only ever views, per the Supervisor-Coach Assignments model used
// elsewhere.
$currentUser = Auth::requireRole(['ASSEMBLY_PRODUCTION']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$toSlotId = (int) ($body['to_slot_id'] ?? 0);

if ($coachId <= 0 || $toSlotId <= 0) {
    Response::error('coach_id and to_slot_id are required.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare(
    "SELECT aso.id, aso.slot_id, aso.assembly_in_id, c.coach_number
     FROM assembly_slot_occupancy aso
     JOIN coaches c ON c.id = aso.coach_id
     WHERE aso.coach_id = :coach_id AND aso.released_at IS NULL"
);
$stmt->execute(['coach_id' => $coachId]);
$current = $stmt->fetch();
if (!$current) {
    Response::error('This coach is not currently occupying an Assembly line slot.', 409);
}
if ((int) $current['slot_id'] === $toSlotId) {
    Response::error('Coach is already in that slot.', 400);
}

$stmt = $pdo->prepare(
    'SELECT s.id, s.slot_number, al.name AS assembly_line_name
     FROM assembly_in_line_slots s
     JOIN assembly_in_lines al ON al.id = s.assembly_in_line_id
     LEFT JOIN assembly_slot_occupancy aso ON aso.slot_id = s.id AND aso.released_at IS NULL
     WHERE s.id = :slot_id AND aso.id IS NULL'
);
$stmt->execute(['slot_id' => $toSlotId]);
$toSlot = $stmt->fetch();
if (!$toSlot) {
    Response::error('Selected slot is not available.', 409);
}

$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE assembly_slot_occupancy SET released_at = NOW() WHERE id = :id')
        ->execute(['id' => $current['id']]);

    $pdo->prepare(
        'INSERT INTO assembly_slot_occupancy (coach_id, slot_id, assembly_in_id, placed_by_user_id, occupied_from)
         VALUES (:coach_id, :slot_id, :assembly_in_id, :placed_by_user_id, NOW())'
    )->execute([
        'coach_id' => $coachId,
        'slot_id' => $toSlotId,
        'assembly_in_id' => $current['assembly_in_id'],
        'placed_by_user_id' => $currentUser['sub'],
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to move coach: ' . $e->getMessage(), 500);
}

Response::ok([
    'coach_number' => $current['coach_number'],
    'assembly_line' => $toSlot['assembly_line_name'],
    'slot_number' => (int) $toSlot['slot_number'],
]);
