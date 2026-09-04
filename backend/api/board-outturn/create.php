<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['OUTTURN_DISPATCH']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$inDate = trim($body['board_outturn_date'] ?? '');
$inTime = trim($body['board_outturn_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if ($coachId <= 0) {
    Response::error('coach_id is required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inDate)) {
    Response::error('board_outturn_date is required in YYYY-MM-DD format.', 400);
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

$stmt = $pdo->prepare('SELECT id FROM lock_seal_records WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
$prior = $stmt->fetch();
if (!$prior) {
    Response::error('This coach has not had Lock & Seal recorded yet.', 409);
}

$stmt = $pdo->prepare('SELECT id FROM board_outturn_records WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Railway Board Outturn already recorded for this coach.', 409);
}

$stmt = $pdo->prepare(
    "SELECT assigned_user_id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'BOARD_OUTTURN' AND status = 'ASSIGNED'"
);
$stmt->execute(['coach_id' => $coachId]);
$assignment = $stmt->fetch();
if (!$assignment || (int) $assignment['assigned_user_id'] !== (int) $currentUser['sub']) {
    Response::error('This coach is not currently assigned to you.', 403);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO board_outturn_records (coach_id, lock_seal_id, board_outturn_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :lock_seal_id, :board_outturn_datetime, :remarks, :recorded_by_user_id)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'lock_seal_id' => $prior['id'],
        'board_outturn_datetime' => $inDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
    ]);
    $newId = (int) $pdo->lastInsertId();

    // Frees up this employee's Railway Board Outturn queue, auto-pulling their next queued coach.
    Assignment::complete($pdo, $coachId, 'BOARD_OUTTURN');
    // Queues/assigns the coach for Physical Dispatch, the next (final) stage in the pipeline.
    Assignment::assignOrQueue($pdo, $coachId, 'PHYSICAL_DISPATCH');

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->errorInfo[1] === 1062) {
        Response::error('Railway Board Outturn already recorded for this coach.', 409);
    }
    Response::error('Failed to record Railway Board Outturn: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Railway Board Outturn: ' . $e->getMessage(), 500);
}

Response::ok([
    'board_outturn_id' => $newId,
    'coach_number' => $coach['coach_number'],
    'board_outturn_datetime' => $inDatetime,
], 201);
