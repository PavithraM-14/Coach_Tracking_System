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
$assemblyInDate = trim($body['assembly_in_date'] ?? '');
$assemblyInTime = trim($body['assembly_in_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if ($coachId <= 0 || $slotId <= 0) {
    Response::error('coach_id and slot_id are required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $assemblyInDate)) {
    Response::error('assembly_in_date is required in YYYY-MM-DD format.', 400);
}
if (!preg_match('/^\d{2}:\d{2}$/', $assemblyInTime)) {
    $assemblyInTime = '00:00';
}
$assemblyInDatetime = "$assemblyInDate $assemblyInTime:00";

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id, coach_number FROM coaches WHERE id = :id');
$stmt->execute(['id' => $coachId]);
$coach = $stmt->fetch();
if (!$coach) {
    Response::error('Coach not found.', 404);
}

$stmt = $pdo->prepare('SELECT id FROM paint_out_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
$paintOut = $stmt->fetch();
if (!$paintOut) {
    Response::error('This coach has not entered Paint Out yet.', 409);
}

$stmt = $pdo->prepare('SELECT id FROM assembly_in_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Assembly In already recorded for this coach.', 409);
}

$stmt = $pdo->prepare(
    'SELECT s.id, s.slot_number, al.id AS assembly_in_line_id, al.name AS assembly_in_line_name
     FROM assembly_in_line_slots s
     JOIN assembly_in_lines al ON al.id = s.assembly_in_line_id
     LEFT JOIN assembly_slot_occupancy aso ON aso.slot_id = s.id AND aso.released_at IS NULL
     WHERE s.id = :slot_id AND aso.id IS NULL AND al.is_active = 1 AND s.is_active = 1'
);
$stmt->execute(['slot_id' => $slotId]);
$slot = $stmt->fetch();
if (!$slot) {
    Response::error('Selected slot is no longer available.', 409);
}

$stmt = $pdo->prepare(
    "SELECT assigned_user_id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'ASSEMBLY_IN' AND status = 'ASSIGNED'"
);
$stmt->execute(['coach_id' => $coachId]);
$assignment = $stmt->fetch();
if (!$assignment || (int) $assignment['assigned_user_id'] !== (int) $currentUser['sub']) {
    Response::error('This coach is not currently assigned to you.', 403);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO assembly_in_transactions
            (coach_id, paint_out_id, assembly_in_line_id, slot_id, assembly_in_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :paint_out_id, :assembly_in_line_id, :slot_id, :assembly_in_datetime, :remarks, :recorded_by_user_id)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'paint_out_id' => $paintOut['id'],
        'assembly_in_line_id' => $slot['assembly_in_line_id'],
        'slot_id' => $slotId,
        'assembly_in_datetime' => $assemblyInDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
    ]);
    $assemblyInId = (int) $pdo->lastInsertId();

    // Opens this coach's slot-occupancy record — see paint-in/create.php for
    // the same pattern (Assembly In/Out share one physical line pool).
    $pdo->prepare(
        'INSERT INTO assembly_slot_occupancy (coach_id, slot_id, assembly_in_id, placed_by_user_id, occupied_from)
         VALUES (:coach_id, :slot_id, :assembly_in_id, :placed_by_user_id, :occupied_from)'
    )->execute([
        'coach_id' => $coachId,
        'slot_id' => $slotId,
        'assembly_in_id' => $assemblyInId,
        'placed_by_user_id' => $currentUser['sub'],
        'occupied_from' => $assemblyInDatetime,
    ]);

    // Frees up this employee's Assembly In capacity, auto-pulling their next queued coach.
    Assignment::complete($pdo, $coachId, 'ASSEMBLY_IN');

    // Assembly Out is only queued immediately if this coach has zero
    // applicable Assembly Operations (see assembly-operations/complete.php,
    // which queues it for Assembly Out once every applicable operation is
    // marked done) — otherwise the coach must clear its operations first.
    $requiredOps = (int) $pdo->query('SELECT COUNT(*) FROM assembly_operations')->fetchColumn();
    $excludedOps = $pdo->prepare('SELECT COUNT(*) FROM assembly_operation_exclusions WHERE coach_id = :coach_id');
    $excludedOps->execute(['coach_id' => $coachId]);
    $requiredOps -= (int) $excludedOps->fetchColumn();
    if ($requiredOps <= 0) {
        Assignment::assignOrQueue($pdo, $coachId, 'ASSEMBLY_OUT');
    }

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->errorInfo[1] === 1062) {
        Response::error('Selected slot was just taken by another user. Please choose another slot.', 409);
    }
    Response::error('Failed to record Assembly In: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Assembly In: ' . $e->getMessage(), 500);
}

Response::ok([
    'assembly_in_id' => $assemblyInId,
    'coach_number' => $coach['coach_number'],
    'assembly_in_line' => $slot['assembly_in_line_name'],
    'slot_number' => (int) $slot['slot_number'],
    'assembly_in_datetime' => $assemblyInDatetime,
], 201);
