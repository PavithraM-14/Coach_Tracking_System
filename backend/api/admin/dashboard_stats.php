<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'PAINT_ADMIN', 'ASSEMBLY_ADMIN']);

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

$awaitingLocalOutturn = (int) $pdo->query(
    "SELECT COUNT(*) FROM assembly_out_transactions aot
     LEFT JOIN local_outturn_records lor ON lor.coach_id = aot.coach_id
     WHERE lor.id IS NULL"
)->fetchColumn();

$awaitingLockSeal = (int) $pdo->query(
    "SELECT COUNT(*) FROM local_outturn_records lor
     LEFT JOIN lock_seal_records lsr ON lsr.coach_id = lor.coach_id
     WHERE lsr.id IS NULL"
)->fetchColumn();

$awaitingBoardOutturn = (int) $pdo->query(
    "SELECT COUNT(*) FROM lock_seal_records lsr
     LEFT JOIN board_outturn_records bor ON bor.coach_id = lsr.coach_id
     WHERE bor.id IS NULL"
)->fetchColumn();

$awaitingPhysicalDispatch = (int) $pdo->query(
    "SELECT COUNT(*) FROM board_outturn_records bor
     LEFT JOIN physical_dispatch_records pdr ON pdr.coach_id = bor.coach_id
     WHERE pdr.id IS NULL"
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
$totalLocalOutturn = (int) $pdo->query('SELECT COUNT(*) FROM local_outturn_records')->fetchColumn();
$totalLockSeal = (int) $pdo->query('SELECT COUNT(*) FROM lock_seal_records')->fetchColumn();
$totalBoardOutturn = (int) $pdo->query('SELECT COUNT(*) FROM board_outturn_records')->fetchColumn();
$totalPhysicalDispatch = (int) $pdo->query('SELECT COUNT(*) FROM physical_dispatch_records')->fetchColumn();
$totalCoaches = (int) $pdo->query('SELECT COUNT(*) FROM coaches')->fetchColumn();

Response::ok([
    'pending_shell_outturn' => $pendingShellOutturn,
    'awaiting_furnishing_in' => $awaitingFurnishingIn,
    'awaiting_paint_in' => $awaitingPaintIn,
    'awaiting_paint_out' => $awaitingPaintOut,
    'awaiting_assembly_in' => $awaitingAssemblyIn,
    'awaiting_assembly_out' => $awaitingAssemblyOut,
    'awaiting_local_outturn' => $awaitingLocalOutturn,
    'awaiting_lock_seal' => $awaitingLockSeal,
    'awaiting_board_outturn' => $awaitingBoardOutturn,
    'awaiting_physical_dispatch' => $awaitingPhysicalDispatch,
    'queued_for_assignment' => $queuedForAssignment,
    'total_coaches' => $totalCoaches,
    'total_shell_outturn' => $totalShellOutturn,
    'total_furnishing_in' => $totalFurnishingIn,
    'total_paint_in' => $totalPaintIn,
    'total_paint_out' => $totalPaintOut,
    'total_assembly_in' => $totalAssemblyIn,
    'total_assembly_out' => $totalAssemblyOut,
    'total_local_outturn' => $totalLocalOutturn,
    'total_lock_seal' => $totalLockSeal,
    'total_board_outturn' => $totalBoardOutturn,
    'total_physical_dispatch' => $totalPhysicalDispatch,
]);
