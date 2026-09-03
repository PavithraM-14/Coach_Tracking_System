<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::currentUser(); // any authenticated role may view their own feed
$pdo = Db::get();

$limit = 30;

if ($currentUser['role'] === 'ADMIN') {
    // System-wide feed: most recent completed work across all three modules.
    $sql = "
        (SELECT 'SHELL_OUTTURN' AS type, c.coach_number, ct.name AS coach_type,
                sot.outturn_datetime AS occurred_at, u.full_name AS performed_by
         FROM shell_outturn_transactions sot
         JOIN coaches c ON c.id = sot.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = sot.recorded_by_user_id)
        UNION ALL
        (SELECT 'FURNISHING_OUT', c.coach_number, ct.name,
                fot.furnishing_out_datetime, u.full_name
         FROM furnishing_out_transactions fot
         JOIN coaches c ON c.id = fot.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = fot.recorded_by_user_id)
        UNION ALL
        (SELECT 'PAINT_IN', c.coach_number, ct.name,
                pit.paint_in_datetime, u.full_name
         FROM paint_in_transactions pit
         JOIN coaches c ON c.id = pit.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = pit.recorded_by_user_id)
        ORDER BY occurred_at DESC
        LIMIT :limit
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
} elseif ($currentUser['role'] === 'SHELL_PRODUCTION') {
    $stmt = $pdo->prepare(
        "SELECT 'SHELL_OUTTURN' AS type, c.coach_number, ct.name AS coach_type,
                sot.outturn_datetime AS occurred_at, u.full_name AS performed_by
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
        "SELECT 'FURNISHING_OUT' AS type, c.coach_number, ct.name AS coach_type,
                fot.furnishing_out_datetime AS occurred_at, u.full_name AS performed_by
         FROM furnishing_out_transactions fot
         JOIN coaches c ON c.id = fot.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = fot.recorded_by_user_id
         WHERE fot.recorded_by_user_id = :user_id
         ORDER BY fot.furnishing_out_datetime DESC
         LIMIT $limit"
    );
    $stmt->execute(['user_id' => $currentUser['sub']]);
} elseif ($currentUser['role'] === 'PAINT') {
    $stmt = $pdo->prepare(
        "SELECT 'PAINT_IN' AS type, c.coach_number, ct.name AS coach_type,
                pit.paint_in_datetime AS occurred_at, u.full_name AS performed_by
         FROM paint_in_transactions pit
         JOIN coaches c ON c.id = pit.coach_id
         JOIN coach_types ct ON ct.id = c.coach_type_id
         JOIN users u ON u.id = pit.recorded_by_user_id
         WHERE pit.recorded_by_user_id = :user_id
         ORDER BY pit.paint_in_datetime DESC
         LIMIT $limit"
    );
    $stmt->execute(['user_id' => $currentUser['sub']]);
} else {
    Response::ok(['data' => []]);
}

$rows = $stmt->fetchAll();

$data = array_map(function ($row) {
    return [
        'type' => $row['type'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'occurred_at' => $row['occurred_at'],
        'performed_by' => $row['performed_by'],
    ];
}, $rows);

Response::ok(['data' => $data]);
