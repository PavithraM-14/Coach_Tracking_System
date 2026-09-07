<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
// paint_out_line_id/slot_id are no longer populated (Paint In/Out now share
// one line pool tracked via paint_slot_occupancy) — LEFT JOIN so historical
// rows that do have them still resolve, and new rows just come back null.
$rows = $pdo->query(
    "SELECT pot.id AS paint_out_id, c.coach_number, ct.name AS coach_type,
            pl.name AS paint_out_line, s.slot_number, pot.paint_out_datetime,
            u.full_name AS recorded_by, pot.status
     FROM paint_out_transactions pot
     JOIN coaches c ON c.id = pot.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     LEFT JOIN paint_out_lines pl ON pl.id = pot.paint_out_line_id
     LEFT JOIN paint_out_line_slots s ON s.id = pot.slot_id
     JOIN users u ON u.id = pot.recorded_by_user_id
     ORDER BY pot.paint_out_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'paint_out_id' => (int) $row['paint_out_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'paint_out_line' => $row['paint_out_line'],
        'slot_number' => $row['slot_number'] !== null ? (int) $row['slot_number'] : null,
        'paint_out_datetime' => $row['paint_out_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
    ];
}, $rows);

Response::ok(['data' => $data]);
