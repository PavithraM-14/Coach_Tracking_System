<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT pit.id AS paint_in_id, c.coach_number, ct.name AS coach_type,
            pl.name AS paint_line, s.slot_number, pit.paint_in_datetime,
            u.full_name AS recorded_by, pit.status
     FROM paint_in_transactions pit
     JOIN coaches c ON c.id = pit.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN paint_lines pl ON pl.id = pit.paint_line_id
     JOIN paint_line_slots s ON s.id = pit.slot_id
     JOIN users u ON u.id = pit.recorded_by_user_id
     ORDER BY pit.paint_in_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'paint_in_id' => (int) $row['paint_in_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'paint_line' => $row['paint_line'],
        'slot_number' => (int) $row['slot_number'],
        'paint_in_datetime' => $row['paint_in_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
    ];
}, $rows);

Response::ok(['data' => $data]);
