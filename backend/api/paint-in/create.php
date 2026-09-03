<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['PAINT']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$slotId = (int) ($body['slot_id'] ?? 0);
$paintInDate = trim($body['paint_in_date'] ?? '');
$paintInTime = trim($body['paint_in_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if ($coachId <= 0 || $slotId <= 0) {
    Response::error('coach_id and slot_id are required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $paintInDate)) {
    Response::error('paint_in_date is required in YYYY-MM-DD format.', 400);
}
if (!preg_match('/^\d{2}:\d{2}$/', $paintInTime)) {
    $paintInTime = '00:00';
}
$paintInDatetime = "$paintInDate $paintInTime:00";

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id, coach_number FROM coaches WHERE id = :id');
$stmt->execute(['id' => $coachId]);
$coach = $stmt->fetch();
if (!$coach) {
    Response::error('Coach not found.', 404);
}

$stmt = $pdo->prepare('SELECT id FROM furnishing_out_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
$furnishingOut = $stmt->fetch();
if (!$furnishingOut) {
    Response::error('This coach has not completed Furnishing Out yet.', 409);
}

$stmt = $pdo->prepare('SELECT id FROM paint_in_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Paint In already recorded for this coach.', 409);
}

$stmt = $pdo->prepare(
    'SELECT s.id, s.slot_number, pl.id AS paint_line_id, pl.name AS paint_line_name
     FROM paint_line_slots s
     JOIN paint_lines pl ON pl.id = s.paint_line_id
     LEFT JOIN paint_in_transactions pit ON pit.slot_id = s.id
     WHERE s.id = :slot_id AND pit.id IS NULL'
);
$stmt->execute(['slot_id' => $slotId]);
$slot = $stmt->fetch();
if (!$slot) {
    Response::error('Selected slot is no longer available.', 409);
}

$stmt = $pdo->prepare(
    "SELECT assigned_user_id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'PAINT' AND status = 'ASSIGNED'"
);
$stmt->execute(['coach_id' => $coachId]);
$assignment = $stmt->fetch();
if (!$assignment || (int) $assignment['assigned_user_id'] !== (int) $currentUser['sub']) {
    Response::error('This coach is not currently assigned to you.', 403);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO paint_in_transactions
            (coach_id, furnishing_out_id, paint_line_id, slot_id, paint_in_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :furnishing_out_id, :paint_line_id, :slot_id, :paint_in_datetime, :remarks, :recorded_by_user_id)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'furnishing_out_id' => $furnishingOut['id'],
        'paint_line_id' => $slot['paint_line_id'],
        'slot_id' => $slotId,
        'paint_in_datetime' => $paintInDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
    ]);
    $paintInId = (int) $pdo->lastInsertId();

    // Frees up this employee's Paint capacity, auto-pulling their next queued coach.
    Assignment::complete($pdo, $coachId, 'PAINT');

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    // Unique constraint on slot_id/coach_id catches a race between the availability
    // check above and this insert.
    if ($e->errorInfo[1] === 1062) {
        Response::error('Selected slot was just taken by another user. Please choose another slot.', 409);
    }
    Response::error('Failed to record Paint In: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Paint In: ' . $e->getMessage(), 500);
}

Response::ok([
    'paint_in_id' => $paintInId,
    'coach_number' => $coach['coach_number'],
    'paint_line' => $slot['paint_line_name'],
    'slot_number' => (int) $slot['slot_number'],
    'paint_in_datetime' => $paintInDatetime,
], 201);
