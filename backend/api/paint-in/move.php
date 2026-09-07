<?php

require_once __DIR__ . '/../../bootstrap.php';

// Only Paint employees move coaches between slots day-to-day (e.g. to free
// up a slot another coach needs) — Paint Admin only ever views, per the
// Supervisor-Coach Assignments model used elsewhere.
$currentUser = Auth::requireRole(['PAINT']);

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
    "SELECT pso.id, pso.slot_id, pso.paint_in_id, c.coach_number
     FROM paint_slot_occupancy pso
     JOIN coaches c ON c.id = pso.coach_id
     WHERE pso.coach_id = :coach_id AND pso.released_at IS NULL"
);
$stmt->execute(['coach_id' => $coachId]);
$current = $stmt->fetch();
if (!$current) {
    Response::error('This coach is not currently occupying a Paint line slot.', 409);
}
if ((int) $current['slot_id'] === $toSlotId) {
    Response::error('Coach is already in that slot.', 400);
}

$stmt = $pdo->prepare(
    'SELECT s.id, s.slot_number, pl.name AS paint_line_name
     FROM paint_line_slots s
     JOIN paint_lines pl ON pl.id = s.paint_line_id
     LEFT JOIN paint_slot_occupancy pso ON pso.slot_id = s.id AND pso.released_at IS NULL
     WHERE s.id = :slot_id AND pso.id IS NULL AND pl.is_active = 1 AND s.is_active = 1'
);
$stmt->execute(['slot_id' => $toSlotId]);
$toSlot = $stmt->fetch();
if (!$toSlot) {
    Response::error('Selected slot is not available.', 409);
}

$pdo->beginTransaction();
try {
    $pdo->prepare('UPDATE paint_slot_occupancy SET released_at = NOW() WHERE id = :id')
        ->execute(['id' => $current['id']]);

    $pdo->prepare(
        'INSERT INTO paint_slot_occupancy (coach_id, slot_id, paint_in_id, placed_by_user_id, occupied_from)
         VALUES (:coach_id, :slot_id, :paint_in_id, :placed_by_user_id, NOW())'
    )->execute([
        'coach_id' => $coachId,
        'slot_id' => $toSlotId,
        'paint_in_id' => $current['paint_in_id'],
        'placed_by_user_id' => $currentUser['sub'],
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to move coach: ' . $e->getMessage(), 500);
}

Response::ok([
    'coach_number' => $current['coach_number'],
    'paint_line' => $toSlot['paint_line_name'],
    'slot_number' => (int) $toSlot['slot_number'],
]);
