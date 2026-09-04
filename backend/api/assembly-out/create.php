<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['ASSEMBLY_PRODUCTION']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$slotId = (int) ($body['slot_id'] ?? 0);
$assemblyOutDate = trim($body['assembly_out_date'] ?? '');
$assemblyOutTime = trim($body['assembly_out_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if ($coachId <= 0 || $slotId <= 0) {
    Response::error('coach_id and slot_id are required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $assemblyOutDate)) {
    Response::error('assembly_out_date is required in YYYY-MM-DD format.', 400);
}
if (!preg_match('/^\d{2}:\d{2}$/', $assemblyOutTime)) {
    $assemblyOutTime = '00:00';
}
$assemblyOutDatetime = "$assemblyOutDate $assemblyOutTime:00";

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id, coach_number FROM coaches WHERE id = :id');
$stmt->execute(['id' => $coachId]);
$coach = $stmt->fetch();
if (!$coach) {
    Response::error('Coach not found.', 404);
}

$stmt = $pdo->prepare('SELECT id FROM assembly_in_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
$assemblyIn = $stmt->fetch();
if (!$assemblyIn) {
    Response::error('This coach has not entered Assembly In yet.', 409);
}

$stmt = $pdo->prepare('SELECT id FROM assembly_out_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Assembly Out already recorded for this coach.', 409);
}

$stmt = $pdo->prepare(
    'SELECT s.id, s.slot_number, al.id AS assembly_out_line_id, al.name AS assembly_out_line_name
     FROM assembly_out_line_slots s
     JOIN assembly_out_lines al ON al.id = s.assembly_out_line_id
     LEFT JOIN assembly_out_transactions aot ON aot.slot_id = s.id
     WHERE s.id = :slot_id AND aot.id IS NULL'
);
$stmt->execute(['slot_id' => $slotId]);
$slot = $stmt->fetch();
if (!$slot) {
    Response::error('Selected slot is no longer available.', 409);
}

$stmt = $pdo->prepare(
    "SELECT assigned_user_id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'ASSEMBLY_OUT' AND status = 'ASSIGNED'"
);
$stmt->execute(['coach_id' => $coachId]);
$assignment = $stmt->fetch();
if (!$assignment || (int) $assignment['assigned_user_id'] !== (int) $currentUser['sub']) {
    Response::error('This coach is not currently assigned to you.', 403);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO assembly_out_transactions
            (coach_id, assembly_in_id, assembly_out_line_id, slot_id, assembly_out_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :assembly_in_id, :assembly_out_line_id, :slot_id, :assembly_out_datetime, :remarks, :recorded_by_user_id)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'assembly_in_id' => $assemblyIn['id'],
        'assembly_out_line_id' => $slot['assembly_out_line_id'],
        'slot_id' => $slotId,
        'assembly_out_datetime' => $assemblyOutDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
    ]);
    $assemblyOutId = (int) $pdo->lastInsertId();

    // Frees up this employee's Assembly Out capacity, auto-pulling their next queued coach.
    // "Assembly Operations" (a future stage between Assembly In and Assembly
    // Out) will insert itself before this line later.
    Assignment::complete($pdo, $coachId, 'ASSEMBLY_OUT');
    // Queues/assigns the coach for Local Outturn, the next stage in the pipeline.
    Assignment::assignOrQueue($pdo, $coachId, 'LOCAL_OUTTURN');

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->errorInfo[1] === 1062) {
        Response::error('Selected slot was just taken by another user. Please choose another slot.', 409);
    }
    Response::error('Failed to record Assembly Out: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Assembly Out: ' . $e->getMessage(), 500);
}

Response::ok([
    'assembly_out_id' => $assemblyOutId,
    'coach_number' => $coach['coach_number'],
    'assembly_out_line' => $slot['assembly_out_line_name'],
    'slot_number' => (int) $slot['slot_number'],
    'assembly_out_datetime' => $assemblyOutDatetime,
], 201);
