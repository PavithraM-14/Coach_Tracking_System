<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

$currentUser = Auth::requireRole(['SHELL_PRODUCTION']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachIds = array_values(array_unique(array_map('intval', $body['coach_ids'] ?? [])));
$outturnDate = trim($body['outturn_date'] ?? '');
$outturnTime = trim($body['outturn_time'] ?? '');
$remarks = isset($body['remarks']) ? trim((string) $body['remarks']) : null;

if (count($coachIds) === 0) {
    Response::error('Select at least one coach.', 400);
}
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $outturnDate)) {
    Response::error('outturn_date is required in YYYY-MM-DD format.', 400);
}
if (!preg_match('/^\d{2}:\d{2}$/', $outturnTime)) {
    $outturnTime = '00:00';
}

$outturnDatetime = "$outturnDate $outturnTime:00";

$pdo = Db::get();

// One coach's failure (not found, or already outturned — e.g. a race with
// another submission) aborts the whole batch rather than leaving some coaches
// outturned and others not, matching the single-coach endpoint's atomicity.
$pdo->beginTransaction();
try {
    $coachStmt = $pdo->prepare('SELECT id, coach_number FROM coaches WHERE id = :id');
    $dupStmt = $pdo->prepare('SELECT id FROM shell_outturn_transactions WHERE coach_id = :coach_id');
    $insertShell = $pdo->prepare(
        'INSERT INTO shell_outturn_transactions (coach_id, outturn_datetime, remarks, recorded_by_user_id)
         VALUES (:coach_id, :outturn_datetime, :remarks, :recorded_by_user_id)'
    );

    $results = [];
    foreach ($coachIds as $coachId) {
        $coachStmt->execute(['id' => $coachId]);
        $coach = $coachStmt->fetch();
        if (!$coach) {
            throw new RuntimeException("Coach id {$coachId} not found.");
        }

        $dupStmt->execute(['coach_id' => $coachId]);
        if ($dupStmt->fetch()) {
            throw new RuntimeException("Shell Outturn already recorded for coach {$coach['coach_number']}.");
        }

        $insertShell->execute([
            'coach_id' => $coachId,
            'outturn_datetime' => $outturnDatetime,
            'remarks' => $remarks,
            'recorded_by_user_id' => $currentUser['sub'],
        ]);
        $shellOutturnId = (int) $pdo->lastInsertId();

        // Queue the coach for a skilled Furnishing employee — Furnishing In
        // itself is a manual step performed on furnishing-in/create.php.
        Assignment::assignOrQueue($pdo, $coachId, 'FURNISHING');

        $results[] = [
            'shell_outturn_id' => $shellOutturnId,
            'coach_number' => $coach['coach_number'],
        ];
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to record Shell Outturn: ' . $e->getMessage(), 500);
}

Response::ok([
    'outturn_datetime' => $outturnDatetime,
    'results' => $results,
], 201);
