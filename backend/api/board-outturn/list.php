<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT bor.id AS board_outturn_id, c.coach_number, ct.name AS coach_type,
            bor.board_outturn_datetime, u.full_name AS recorded_by, bor.status, lor.outturn_serial_no, lor.railway
     FROM board_outturn_records bor
     JOIN coaches c ON c.id = bor.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users u ON u.id = bor.recorded_by_user_id
     JOIN local_outturn_records lor ON lor.coach_id = bor.coach_id
     ORDER BY bor.board_outturn_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'board_outturn_id' => (int) $row['board_outturn_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'board_outturn_datetime' => $row['board_outturn_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
        'outturn_serial_no' => $row['outturn_serial_no'],
        'railway' => $row['railway'],
    ];
}, $rows);

Response::ok(['data' => $data]);
