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

// Total completed-so-far per stage, for the WIP-style pipeline board (each
// stage card pairs this "done" count with that same stage's "awaiting"
// count above — mirrors the legacy dashboard's stage-wise holdings, using
// our own real numbers instead of replicating its undocumented formulas).
$totalShellOutturn = (int) $pdo->query('SELECT COUNT(*) FROM shell_outturn_transactions')->fetchColumn();
$totalFurnishingIn = (int) $pdo->query('SELECT COUNT(*) FROM furnishing_in_records')->fetchColumn();
$totalPaintIn = (int) $pdo->query('SELECT COUNT(*) FROM paint_in_transactions')->fetchColumn();
$totalPaintOut = (int) $pdo->query('SELECT COUNT(*) FROM paint_out_transactions')->fetchColumn();
$totalAssemblyIn = (int) $pdo->query('SELECT COUNT(*) FROM assembly_in_transactions')->fetchColumn();
$totalAssemblyOut = (int) $pdo->query('SELECT COUNT(*) FROM assembly_out_transactions')->fetchColumn();
$totalCoaches = (int) $pdo->query('SELECT COUNT(*) FROM coaches')->fetchColumn();

Response::ok([
    'pending_shell_outturn' => $pendingShellOutturn,
    'awaiting_furnishing_in' => $awaitingFurnishingIn,
    'awaiting_paint_in' => $awaitingPaintIn,
    'awaiting_paint_out' => $awaitingPaintOut,
    'awaiting_assembly_in' => $awaitingAssemblyIn,
    'awaiting_assembly_out' => $awaitingAssemblyOut,
    'queued_for_assignment' => $queuedForAssignment,
    'total_coaches' => $totalCoaches,
    'total_shell_outturn' => $totalShellOutturn,
    'total_furnishing_in' => $totalFurnishingIn,
    'total_paint_in' => $totalPaintIn,
    'total_paint_out' => $totalPaintOut,
    'total_assembly_in' => $totalAssemblyIn,
    'total_assembly_out' => $totalAssemblyOut,
]);
