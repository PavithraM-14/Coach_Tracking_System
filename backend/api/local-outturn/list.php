<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT lor.id AS local_outturn_id, c.coach_number, ct.name AS coach_type,
            lor.local_outturn_datetime, u.full_name AS recorded_by, lor.status, lor.outturn_serial_no
     FROM local_outturn_records lor
     JOIN coaches c ON c.id = lor.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users u ON u.id = lor.recorded_by_user_id
     ORDER BY lor.local_outturn_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'local_outturn_id' => (int) $row['local_outturn_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'local_outturn_datetime' => $row['local_outturn_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
        'outturn_serial_no' => $row['outturn_serial_no'],
    ];
}, $rows);

Response::ok(['data' => $data]);
