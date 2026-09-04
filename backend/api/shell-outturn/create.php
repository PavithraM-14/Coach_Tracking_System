<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['SHELL_PRODUCTION']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachId = (int) ($body['coach_id'] ?? 0);
$outturnDate = trim($body['outturn_date'] ?? '');
$outturnTime = trim($body['outturn_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if ($coachId <= 0) {
    Response::error('coach_id is required.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $outturnDate)) {
    Response::error('outturn_date is required in YYYY-MM-DD format.', 400);
}
if (!preg_match('/^\d{2}:\d{2}$/', $outturnTime)) {
    $outturnTime = '00:00';
}

$outturnDatetime = "$outturnDate $outturnTime:00";

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id, coach_number FROM coaches WHERE id = :id');
$stmt->execute(['id' => $coachId]);
$coach = $stmt->fetch();
if (!$coach) {
    Response::error('Coach not found.', 404);
}

$stmt = $pdo->prepare('SELECT id FROM shell_outturn_transactions WHERE coach_id = :coach_id');
$stmt->execute(['coach_id' => $coachId]);
if ($stmt->fetch()) {
    Response::error('Shell Outturn already recorded for this coach.', 409);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO shell_outturn_transactions (coach_id, outturn_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :outturn_datetime, :remarks, :recorded_by_user_id)'
    );
    $stmt->execute([
        'coach_id' => $coachId,
        'outturn_datetime' => $outturnDatetime,
        'remarks' => $remarks,
        'recorded_by_user_id' => $currentUser['sub'],
    ]);
    $shellOutturnId = (int) $pdo->lastInsertId();

    // Coach is now eligible for Furnishing In — assign it to an available
    // skilled Furnishing employee, or queue it if everyone with that skill is
    // at capacity. Furnishing In itself is a manual step (see
    // backend/api/furnishing-in/create.php): the assigned employee sees this
    // Shell Outturn date pre-filled but can edit it before submitting.
    Assignment::assignOrQueue($pdo, $coachId, 'FURNISHING');

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Shell Outturn: ' . $e->getMessage(), 500);
}

Response::ok([
    'shell_outturn_id' => $shellOutturnId,
    'coach_number' => $coach['coach_number'],
    'outturn_datetime' => $outturnDatetime,
], 201);
