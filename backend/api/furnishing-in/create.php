<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['FURNISHING']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$inDate = trim($body['furnishing_in_date'] ?? '');
$inTime = trim($body['furnishing_in_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if ($coachId <= 0) {
    Response::error('coach_id is required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $inDate)) {
    Response::error('furnishing_in_date is required in YYYY-MM-DD format.', 400);
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

$stmt = $pdo->prepare('SELECT id FROM shell_outturn_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
$shellOutturn = $stmt->fetch();
if (!$shellOutturn) {
    Response::error('This coach has not had Shell Outturn recorded yet.', 409);
}

$stmt = $pdo->prepare('SELECT id FROM furnishing_in_records WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Furnishing In already recorded for this coach.', 409);
}

$stmt = $pdo->prepare(
    "SELECT assigned_user_id FROM coach_assignments WHERE coach_id = :coach_id AND module = 'FURNISHING' AND status = 'ASSIGNED'"
);
$stmt->execute(['coach_id' => $coachId]);
$assignment = $stmt->fetch();
if (!$assignment || (int) $assignment['assigned_user_id'] !== (int) $currentUser['sub']) {
    Response::error('This coach is not currently assigned to you.', 403);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO furnishing_in_records (coach_id, shell_outturn_id, furnishing_in_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :shell_outturn_id, :furnishing_in_datetime, :remarks, :recorded_by_user_id)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'shell_outturn_id' => $shellOutturn['id'],
        'furnishing_in_datetime' => $inDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
    ]);
    $furnishingInId = (int) $pdo->lastInsertId();

    // Frees up this employee's Furnishing capacity (auto-pulling their next
    // queued coach), and opens up Paint eligibility for this coach.
    Assignment::complete($pdo, $coachId, 'FURNISHING');
    Assignment::assignOrQueue($pdo, $coachId, 'PAINT');

    $pdo->commit();
} catch (PDOException $e) {
    $pdo->rollBack();
    if ($e->errorInfo[1] === 1062) {
        Response::error('Furnishing In already recorded for this coach.', 409);
    }
    Response::error('Failed to record Furnishing In: ' . $e->getMessage(), 500);
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Furnishing In: ' . $e->getMessage(), 500);
}

Response::ok([
    'furnishing_in_id' => $furnishingInId,
    'coach_number' => $coach['coach_number'],
    'furnishing_in_datetime' => $inDatetime,
], 201);
