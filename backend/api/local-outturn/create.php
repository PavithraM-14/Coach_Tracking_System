<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['OUTTURN_DISPATCH']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$inDate = trim($body['local_outturn_date'] ?? '');
$inTime = trim($body['local_outturn_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;
$serialNo = trim($body['outturn_serial_no'] ?? '');
$railway = trim($body['railway'] ?? '');

if ($coachId <= 0) {
    Response::error('coach_id is required.', 400);
}
if ($serialNo === '') {
    Response::error('outturn_serial_no is required.', 400);
}
if (!in_array($railway, ['ICF', 'SR'], true)) {
    Response::error('railway is required and must be one of ICF, SR.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inDate)) {
    Response::error('local_outturn_date is required in YYYY-MM-DD format.', 400);
}
if (!preg_match('/^\d{2}:\d{2}$/', $inTime)) {
    $inTime = '00:00';
}
$inDatetime = "$inDate $inTime:00";

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id, coach_number FROM coaches WHERE id = :id');
$stmt->execute(['id' => $coachId]);
$coach = $stmt->fetch();
if (!$coach) {
    Response::error('Coach not found.', 404);
}

$stmt = $pdo->prepare('SELECT id FROM assembly_out_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
$prior = $stmt->fetch();
if (!$prior) {
    Response::error('This coach has not had Assembly Out recorded yet.', 409);
}

$stmt = $pdo->prepare('SELECT id FROM local_outturn_records WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Local Outturn already recorded for this coach.', 409);
}

$stmt = $pdo->prepare(
    "SELECT assigned_user_id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'LOCAL_OUTTURN' AND status = 'ASSIGNED'"
);
$stmt->execute(['coach_id' => $coachId]);
$assignment = $stmt->fetch();
if (!$assignment || (int) $assignment['assigned_user_id'] !== (int) $currentUser['sub']) {
    Response::error('This coach is not currently assigned to you.', 403);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO local_outturn_records (coach_id, assembly_out_id, local_outturn_datetime, remarks, recorded_by_user_id, outturn_serial_no, railway)
         VALUES (:coach_id, :assembly_out_id, :local_outturn_datetime, :remarks, :recorded_by_user_id, :outturn_serial_no, :railway)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'assembly_out_id' => $prior['id'],
        'local_outturn_datetime' => $inDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
        'outturn_serial_no' => $serialNo,
        'railway' => $railway,
    ]);
    $newId = (int) $pdo->lastInsertId();

    // Frees up this employee's Local Outturn queue, auto-pulling their next queued coach.
    Assignment::complete($pdo, $coachId, 'LOCAL_OUTTURN');
    // Queues/assigns the coach for Lock & Seal, the next stage in the pipeline.
    Assignment::assignOrQueue($pdo, $coachId, 'LOCK_SEAL');

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->errorInfo[1] === 1062) {
        Response::error('Local Outturn already recorded for this coach.', 409);
    }
    Response::error('Failed to record Local Outturn: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Local Outturn: ' . $e->getMessage(), 500);
}

Response::ok([
    'local_outturn_id' => $newId,
    'coach_number' => $coach['coach_number'],
    'local_outturn_datetime' => $inDatetime,
    'outturn_serial_no' => $serialNo,
    'railway' => $railway,
], 201);
