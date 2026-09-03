<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT sot.id AS shell_outturn_id, c.coach_number, ct.name AS coach_type,
            sot.outturn_datetime, u.full_name AS recorded_by, sot.status
     FROM shell_outturn_transactions sot
     JOIN coaches c ON c.id = sot.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users u ON u.id = sot.recorded_by_user_id
     ORDER BY sot.outturn_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'shell_outturn_id' => (int) $row['shell_outturn_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'outturn_datetime' => $row['outturn_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
    ];
}, $rows);

Response::ok(['data' => $data]);
