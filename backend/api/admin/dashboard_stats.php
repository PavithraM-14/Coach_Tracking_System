<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();

$pendingShellOutturn = (int) $pdo->query(
    'SELECT COUNT(*) FROM coaches c LEFT JOIN shell_outturn_transactions sot ON sot.coach_id = c.id WHERE sot.id IS NULL'
)->fetchColumn();

$awaitingFurnishingOut = (int) $pdo->query(
    "SELECT COUNT(*) FROM furnishing_in_records fir
     LEFT JOIN furnishing_out_transactions fot ON fot.coach_id = fir.coach_id
     WHERE fot.id IS NULL"
)->fetchColumn();

$awaitingPaintIn = (int) $pdo->query(
    "SELECT COUNT(*) FROM furnishing_out_transactions fot
     LEFT JOIN paint_in_transactions pit ON pit.coach_id = fot.coach_id
     WHERE pit.id IS NULL"
)->fetchColumn();

$queuedForAssignment = (int) $pdo->query(
    "SELECT COUNT(*) FROM coach_assignments WHERE status = 'QUEUED'"
)->fetchColumn();

Response::ok([
    'pending_shell_outturn' => $pendingShellOutturn,
    'awaiting_furnishing_out' => $awaitingFurnishingOut,
    'awaiting_paint_in' => $awaitingPaintIn,
    'queued_for_assignment' => $queuedForAssignment,
]);
