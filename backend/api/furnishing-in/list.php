<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['FURNISHING']);

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT fir.id AS furnishing_in_id, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
            fir.furnishing_in_datetime, sot.outturn_datetime AS shell_outturn_datetime,
            u.full_name AS recorded_by,
            pit.paint_in_datetime, pit.id AS paint_in_id
     FROM furnishing_in_records fir
     JOIN coaches c ON c.id = fir.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN shell_outturn_transactions sot ON sot.id = fir.shell_outturn_id
     JOIN users u ON u.id = fir.recorded_by_user_id
     LEFT JOIN paint_in_transactions pit ON pit.coach_id = c.id
     ORDER BY fir.furnishing_in_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'furnishing_in_id' => (int) $row['furnishing_in_id'],
        'coach_id' => (int) $row['coach_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'furnishing_in_datetime' => $row['furnishing_in_datetime'],
        'shell_outturn_datetime' => $row['shell_outturn_datetime'],
        'recorded_by' => $row['recorded_by'],
        'paint_in_datetime' => $row['paint_in_datetime'],
        'status' => $row['paint_in_id'] !== null ? 'PAINT_IN' : 'FURNISHING_IN',
    ];
}, $rows);

Response::ok(['data' => $data]);
