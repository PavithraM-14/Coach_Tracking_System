<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT pdr.id AS physical_dispatch_id, c.coach_number, ct.name AS coach_type,
            pdr.dispatch_datetime, u.full_name AS recorded_by, pdr.status, lor.outturn_serial_no, lor.railway
     FROM physical_dispatch_records pdr
     JOIN coaches c ON c.id = pdr.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users u ON u.id = pdr.recorded_by_user_id
     JOIN local_outturn_records lor ON lor.coach_id = pdr.coach_id
     ORDER BY pdr.dispatch_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'physical_dispatch_id' => (int) $row['physical_dispatch_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'dispatch_datetime' => $row['dispatch_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
        'outturn_serial_no' => $row['outturn_serial_no'],
        'railway' => $row['railway'],
    ];
}, $rows);

Response::ok(['data' => $data]);
