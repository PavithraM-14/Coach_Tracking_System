<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::currentUser(); // any authenticated role may view their own feed
$pdo = Db::get();

$limit = 30;

if ($currentUser['role'] === 'ADMIN') {
    // System-wide feed: most recent completed work across all six stages.
    $sql = "
        (SELECT 'SHELL_OUTTURN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                sot.outturn_datetime AS occurred_at, u.full_name AS performed_by, sot.remarks
         FROM shell_outturn_transactions sot
         JOIN coaches c ON c.id = sot.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = sot.recorded_by_user_id)
        UNION ALL
        (SELECT 'FURNISHING_IN', c.id, c.coach_number, ct.name,
                fir.furnishing_in_datetime, u.full_name, fir.remarks
         FROM furnishing_in_records fir
         JOIN coaches c ON c.id = fir.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = fir.recorded_by_user_id)
        UNION ALL
        (SELECT 'PAINT_IN', c.id, c.coach_number, ct.name,
                pit.paint_in_datetime, u.full_name, pit.remarks
         FROM paint_in_transactions pit
         JOIN coaches c ON c.id = pit.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = pit.recorded_by_user_id)
        UNION ALL
        (SELECT 'PAINT_OUT', c.id, c.coach_number, ct.name,
                pot.paint_out_datetime, u.full_name, pot.remarks
         FROM paint_out_transactions pot
         JOIN coaches c ON c.id = pot.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = pot.recorded_by_user_id)
        UNION ALL
        (SELECT 'ASSEMBLY_IN', c.id, c.coach_number, ct.name,
                ait.assembly_in_datetime, u.full_name, ait.remarks
         FROM assembly_in_transactions ait
         JOIN coaches c ON c.id = ait.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = ait.recorded_by_user_id)
        UNION ALL
        (SELECT 'ASSEMBLY_OUT', c.id, c.coach_number, ct.name,
                aot.assembly_out_datetime, u.full_name, aot.remarks
         FROM assembly_out_transactions aot
         JOIN coaches c ON c.id = aot.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = aot.recorded_by_user_id)
        UNION ALL
        (SELECT 'LOCAL_OUTTURN', c.id, c.coach_number, ct.name,
                lor.local_outturn_datetime, u.full_name, lor.remarks
         FROM local_outturn_records lor
         JOIN coaches c ON c.id = lor.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = lor.recorded_by_user_id)
        UNION ALL
        (SELECT 'LOCK_SEAL', c.id, c.coach_number, ct.name,
                lsr.lock_seal_datetime, u.full_name, lsr.remarks
         FROM lock_seal_records lsr
         JOIN coaches c ON c.id = lsr.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = lsr.recorded_by_user_id)
        UNION ALL
        (SELECT 'BOARD_OUTTURN', c.id, c.coach_number, ct.name,
                bor.board_outturn_datetime, u.full_name, bor.remarks
         FROM board_outturn_records bor
         JOIN coaches c ON c.id = bor.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = bor.recorded_by_user_id)
        UNION ALL
        (SELECT 'PHYSICAL_DISPATCH', c.id, c.coach_number, ct.name,
                pdr.dispatch_datetime, u.full_name, pdr.remarks
         FROM physical_dispatch_records pdr
         JOIN coaches c ON c.id = pdr.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = pdr.recorded_by_user_id)
        ORDER BY occurred_at DESC
        LIMIT :limit
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
} elseif ($currentUser['role'] === 'SHELL_PRODUCTION') {
    $stmt = $pdo->prepare(
        "SELECT 'SHELL_OUTTURN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                sot.outturn_datetime AS occurred_at, u.full_name AS performed_by, sot.remarks
         FROM shell_outturn_transactions sot
         JOIN coaches c ON c.id = sot.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = sot.recorded_by_user_id
         WHERE sot.recorded_by_user_id = :user_id
         ORDER BY sot.outturn_datetime DESC
         LIMIT $limit"
    );
    $stmt->execute(['user_id' => $currentUser['sub']]);
} elseif ($currentUser['role'] === 'FURNISHING') {
    $stmt = $pdo->prepare(
        "SELECT 'FURNISHING_IN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                fir.furnishing_in_datetime AS occurred_at, u.full_name AS performed_by, fir.remarks
         FROM furnishing_in_records fir
         JOIN coaches c ON c.id = fir.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = fir.recorded_by_user_id
         WHERE fir.recorded_by_user_id = :user_id
         ORDER BY fir.furnishing_in_datetime DESC
         LIMIT $limit"
    );
    $stmt->execute(['user_id' => $currentUser['sub']]);
} elseif ($currentUser['role'] === 'PAINT') {
    $stmt = $pdo->prepare(
        "(SELECT 'PAINT_IN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                 pit.paint_in_datetime AS occurred_at, u.full_name AS performed_by, pit.remarks
          FROM paint_in_transactions pit
          JOIN coaches c ON c.id = pit.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = pit.recorded_by_user_id
          WHERE pit.recorded_by_user_id = :user_id1)
         UNION ALL
         (SELECT 'PAINT_OUT', c.id, c.coach_number, ct.name,
                 pot.paint_out_datetime, u.full_name, pot.remarks
          FROM paint_out_transactions pot
          JOIN coaches c ON c.id = pot.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = pot.recorded_by_user_id
          WHERE pot.recorded_by_user_id = :user_id2)
         ORDER BY occurred_at DESC
         LIMIT $limit"
    );
    $stmt->execute(['user_id1' => $currentUser['sub'], 'user_id2' => $currentUser['sub']]);
} elseif ($currentUser['role'] === 'ASSEMBLY_PRODUCTION') {
    $stmt = $pdo->prepare(
        "(SELECT 'ASSEMBLY_IN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                 ait.assembly_in_datetime AS occurred_at, u.full_name AS performed_by, ait.remarks
          FROM assembly_in_transactions ait
          JOIN coaches c ON c.id = ait.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = ait.recorded_by_user_id
          WHERE ait.recorded_by_user_id = :user_id1)
         UNION ALL
         (SELECT 'ASSEMBLY_OUT', c.id, c.coach_number, ct.name,
                 aot.assembly_out_datetime, u.full_name, aot.remarks
          FROM assembly_out_transactions aot
          JOIN coaches c ON c.id = aot.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = aot.recorded_by_user_id
          WHERE aot.recorded_by_user_id = :user_id2)
         ORDER BY occurred_at DESC
         LIMIT $limit"
    );
    $stmt->execute(['user_id1' => $currentUser['sub'], 'user_id2' => $currentUser['sub']]);
} elseif ($currentUser['role'] === 'PAINT_ADMIN') {
    // System-wide across all Paint workers, not just this login's own work —
    // Paint Admin doesn't record transactions itself, it oversees the shop.
    $stmt = $pdo->prepare(
        "(SELECT 'PAINT_IN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                 pit.paint_in_datetime AS occurred_at, u.full_name AS performed_by, pit.remarks
          FROM paint_in_transactions pit
          JOIN coaches c ON c.id = pit.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = pit.recorded_by_user_id)
         UNION ALL
         (SELECT 'PAINT_OUT', c.id, c.coach_number, ct.name,
                 pot.paint_out_datetime, u.full_name, pot.remarks
          FROM paint_out_transactions pot
          JOIN coaches c ON c.id = pot.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = pot.recorded_by_user_id)
         ORDER BY occurred_at DESC
         LIMIT $limit"
    );
    $stmt->execute();
} elseif ($currentUser['role'] === 'ASSEMBLY_ADMIN') {
    // System-wide across all Assembly workers — same reasoning as Paint Admin above.
    $stmt = $pdo->prepare(
        "(SELECT 'ASSEMBLY_IN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                 ait.assembly_in_datetime AS occurred_at, u.full_name AS performed_by, ait.remarks
          FROM assembly_in_transactions ait
          JOIN coaches c ON c.id = ait.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = ait.recorded_by_user_id)
         UNION ALL
         (SELECT 'ASSEMBLY_OUT', c.id, c.coach_number, ct.name,
                 aot.assembly_out_datetime, u.full_name, aot.remarks
          FROM assembly_out_transactions aot
          JOIN coaches c ON c.id = aot.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = aot.recorded_by_user_id)
         ORDER BY occurred_at DESC
         LIMIT $limit"
    );
    $stmt->execute();
} elseif ($currentUser['role'] === 'OUTTURN_DISPATCH') {
    $stmt = $pdo->prepare(
        "(SELECT 'LOCAL_OUTTURN' AS type, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
                 lor.local_outturn_datetime AS occurred_at, u.full_name AS performed_by, lor.remarks
          FROM local_outturn_records lor
          JOIN coaches c ON c.id = lor.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = lor.recorded_by_user_id
          WHERE lor.recorded_by_user_id = :user_id1)
         UNION ALL
         (SELECT 'LOCK_SEAL', c.id, c.coach_number, ct.name,
                 lsr.lock_seal_datetime, u.full_name, lsr.remarks
          FROM lock_seal_records lsr
          JOIN coaches c ON c.id = lsr.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = lsr.recorded_by_user_id
          WHERE lsr.recorded_by_user_id = :user_id2)
         UNION ALL
         (SELECT 'BOARD_OUTTURN', c.id, c.coach_number, ct.name,
                 bor.board_outturn_datetime, u.full_name, bor.remarks
          FROM board_outturn_records bor
          JOIN coaches c ON c.id = bor.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = bor.recorded_by_user_id
          WHERE bor.recorded_by_user_id = :user_id3)
         UNION ALL
         (SELECT 'PHYSICAL_DISPATCH', c.id, c.coach_number, ct.name,
                 pdr.dispatch_datetime, u.full_name, pdr.remarks
          FROM physical_dispatch_records pdr
          JOIN coaches c ON c.id = pdr.coach_id
          JOIN coach_types ct ON ct.id = c.coach_type_id
          JOIN users u ON u.id = pdr.recorded_by_user_id
          WHERE pdr.recorded_by_user_id = :user_id4)
         ORDER BY occurred_at DESC
         LIMIT $limit"
    );
    $stmt->execute([
        'user_id1' => $currentUser['sub'],
        'user_id2' => $currentUser['sub'],
        'user_id3' => $currentUser['sub'],
        'user_id4' => $currentUser['sub'],
    ]);
} else {
    Response::ok(['data' => []]);
}

$rows = $stmt->fetchAll();

$data = array_map(function ($row) {
    return [
        'type' => $row['type'],
        'coach_id' => (int) $row['coach_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'occurred_at' => $row['occurred_at'],
        'performed_by' => $row['performed_by'],
        'remarks' => $row['remarks'],
    ];
}, $rows);

Response::ok(['data' => $data]);
