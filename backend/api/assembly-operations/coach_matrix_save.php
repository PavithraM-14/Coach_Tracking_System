<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$exclusions = is_array($body['exclusions'] ?? null) ? $body['exclusions'] : [];

$pdo = Db::get();

// Validate every row references a real coach and a real operation before
// touching the table — a bad id anywhere aborts the whole save.
$validCoachIds = array_map('intval', array_column($pdo->query('SELECT id FROM coaches')->fetchAll(), 'id'));
$validOperationIds = array_map('intval', array_column($pdo->query('SELECT id FROM assembly_operations')->fetchAll(), 'id'));

$rows = [];
$seen = [];
foreach ($exclusions as $row) {
    $coachId = (int) ($row['coach_id'] ?? 0);
    $operationId = (int) ($row['operation_id'] ?? 0);

    if (!in_array($coachId, $validCoachIds, true)) {
        Response::error("Invalid coach_id: {$coachId}.", 400);
    }
    if (!in_array($operationId, $validOperationIds, true)) {
        Response::error("Invalid operation_id: {$operationId}.", 400);
    }

    $key = $coachId . ':' . $operationId;
    if (!isset($seen[$key])) {
        $seen[$key] = true;
        $rows[] = ['coach_id' => $coachId, 'operation_id' => $operationId];
    }
}

$pdo->beginTransaction();
try {
    // Full replace: the Save button submits the entire grid's exclusion set
    // each time, so clearing and re-inserting is simpler than diffing.
    $pdo->exec('DELETE FROM assembly_operation_exclusions');

    $insert = $pdo->prepare(
        'INSERT INTO assembly_operation_exclusions (coach_id, operation_id) VALUES (:coach_id, :operation_id)'
    );
    foreach ($rows as $row) {
        $insert->execute($row);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to save exclusions: ' . $e->getMessage(), 500);
}

Response::ok(['saved' => count($rows)]);
