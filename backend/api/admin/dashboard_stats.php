<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();

$pendingShellOutturn = (int) $pdo->query(
    'SELECT COUNT(*) FROM coaches c LEFT JOIN shell_outturn_transactions sot ON sot.coach_id = c.id WHERE sot.id IS NULL'
)->fetchColumn();

$awaitingFurnishingIn = (int) $pdo->query(
    "SELECT COUNT(*) FROM shell_outturn_transactions sot
     LEFT JOIN furnishing_in_records fir ON fir.coach_id = sot.coach_id
     WHERE fir.id IS NULL"
)->fetchColumn();

$awaitingPaintIn = (int) $pdo->query(
    "SELECT COUNT(*) FROM furnishing_in_records fir
     LEFT JOIN paint_in_transactions pit ON pit.coach_id = fir.coach_id
     WHERE pit.id IS NULL"
)->fetchColumn();

$awaitingPaintOut = (int) $pdo->query(
    "SELECT COUNT(*) FROM paint_in_transactions pit
     LEFT JOIN paint_out_transactions pot ON pot.coach_id = pit.coach_id
     WHERE pot.id IS NULL"
)->fetchColumn();

$awaitingAssemblyIn = (int) $pdo->query(
    "SELECT COUNT(*) FROM paint_out_transactions pot
     LEFT JOIN assembly_in_transactions ait ON ait.coach_id = pot.coach_id
     WHERE ait.id IS NULL"
)->fetchColumn();

$awaitingAssemblyOut = (int) $pdo->query(
    "SELECT COUNT(*) FROM assembly_in_transactions ait
     LEFT JOIN assembly_out_transactions aot ON aot.coach_id = ait.coach_id
     WHERE aot.id IS NULL"
)->fetchColumn();

$queuedForAssignment = (int) $pdo->query(
    "SELECT COUNT(*) FROM coach_assignments WHERE status = 'QUEUED'"
)->fetchColumn();

Response::ok([
    'pending_shell_outturn' => $pendingShellOutturn,
    'awaiting_furnishing_in' => $awaitingFurnishingIn,
    'awaiting_paint_in' => $awaitingPaintIn,
    'awaiting_paint_out' => $awaitingPaintOut,
    'awaiting_assembly_in' => $awaitingAssemblyIn,
    'awaiting_assembly_out' => $awaitingAssemblyOut,
    'queued_for_assignment' => $queuedForAssignment,
]);
