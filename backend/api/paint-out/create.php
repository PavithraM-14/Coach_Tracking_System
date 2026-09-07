<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['PAINT']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$paintOutDate = trim($body['paint_out_date'] ?? '');
$paintOutTime = trim($body['paint_out_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if ($coachId <= 0) {
    Response::error('coach_id is required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $paintOutDate)) {
    Response::error('paint_out_date is required in YYYY-MM-DD format.', 400);
}
if (!preg_match('/^\d{2}:\d{2}$/', $paintOutTime)) {
    $paintOutTime = '00:00';
}
$paintOutDatetime = "$paintOutDate $paintOutTime:00";

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id, coach_number FROM coaches WHERE id = :id');
$stmt->execute(['id' => $coachId]);
$coach = $stmt->fetch();
if (!$coach) {
    Response::error('Coach not found.', 404);
}

$stmt = $pdo->prepare('SELECT id FROM paint_in_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
$paintIn = $stmt->fetch();
if (!$paintIn) {
    Response::error('This coach has not entered Paint In yet.', 409);
}

$stmt = $pdo->prepare('SELECT id FROM paint_out_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Paint Out already recorded for this coach.', 409);
}

$stmt = $pdo->prepare(
    "SELECT assigned_user_id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'PAINT_OUT' AND status = 'ASSIGNED'"
);
$stmt->execute(['coach_id' => $coachId]);
$assignment = $stmt->fetch();
if (!$assignment || (int) $assignment['assigned_user_id'] !== (int) $currentUser['sub']) {
    Response::error('This coach is not currently assigned to you.', 403);
}

$pdo->beginTransaction();
try {
    // No line/slot here — Paint In and Paint Out now share one physical
    // line pool (paint_lines). A coach keeps whatever slot it's currently
    // in (see paint_slot_occupancy, movable via paint-in/move.php) all the
    // way through to Paint Out, which simply closes that occupancy out.
    $stmt = $pdo->prepare(
        'INSERT INTO paint_out_transactions (coach_id, paint_in_id, paint_out_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :paint_in_id, :paint_out_datetime, :remarks, :recorded_by_user_id)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'paint_in_id' => $paintIn['id'],
        'paint_out_datetime' => $paintOutDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
    ]);
    $paintOutId = (int) $pdo->lastInsertId();

    $pdo->prepare(
        'UPDATE paint_slot_occupancy SET released_at = :released_at WHERE coach_id = :coach_id AND released_at IS NULL'
    )->execute(['released_at' => $paintOutDatetime, 'coach_id' => $coachId]);

    // Frees up this employee's Paint Out capacity, auto-pulling their next queued coach.
    Assignment::complete($pdo, $coachId, 'PAINT_OUT');
    // Queues/assigns the coach for Assembly In, the next stage in the pipeline.
    Assignment::assignOrQueue($pdo, $coachId, 'ASSEMBLY_IN');

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->errorInfo[1] === 1062) {
        Response::error('Paint Out was just recorded for this coach by someone else.', 409);
    }
    Response::error('Failed to record Paint Out: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Paint Out: ' . $e->getMessage(), 500);
}

Response::ok([
    'paint_out_id' => $paintOutId,
    'coach_number' => $coach['coach_number'],
    'paint_out_datetime' => $paintOutDatetime,
], 201);
