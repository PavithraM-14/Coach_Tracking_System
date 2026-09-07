<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'PAINT_ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$assignments = is_array($body['assignments'] ?? null) ? $body['assignments'] : [];

$pdo = Db::get();

// Validate every row references a real, active PAINT user and a real coach
// type before touching the table — a bad id anywhere aborts the whole save
// rather than silently dropping rows.
$validUserIds = array_column(
    $pdo->query("SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.code = 'PAINT' AND u.is_active = 1")->fetchAll(),
    'id'
);
$validUserIds = array_map('intval', $validUserIds);
$validTypeIds = array_map('intval', array_column($pdo->query('SELECT id FROM coach_types')->fetchAll(), 'id'));

$rows = [];
foreach ($assignments as $row) {
    $userId = (int) ($row['user_id'] ?? 0);
    $coachTypeId = (int) ($row['coach_type_id'] ?? 0);
    $canIn = !empty($row['can_in']);
    $canOut = !empty($row['can_out']);

    if (!in_array($userId, $validUserIds, true)) {
        Response::error("Invalid or inactive Paint user_id: {$userId}.", 400);
    }
    if (!in_array($coachTypeId, $validTypeIds, true)) {
        Response::error("Invalid coach_type_id: {$coachTypeId}.", 400);
    }
    if ($canIn || $canOut) {
        $rows[] = ['user_id' => $userId, 'coach_type_id' => $coachTypeId, 'can_in' => $canIn ? 1 : 0, 'can_out' => $canOut ? 1 : 0];
    }
}

$pdo->beginTransaction();
try {
    // Full replace: the Save button submits the entire grid state each time,
    // so clearing and re-inserting is simpler and safer than diffing.
    $pdo->exec('DELETE FROM paint_type_assignments');

    $insert = $pdo->prepare(
        'INSERT INTO paint_type_assignments (user_id, coach_type_id, can_in, can_out)
         VALUES (:user_id, :coach_type_id, :can_in, :can_out)'
    );
    foreach ($rows as $row) {
        $insert->execute($row);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to save assignments: ' . $e->getMessage(), 500);
}

Response::ok(['saved' => count($rows)]);
