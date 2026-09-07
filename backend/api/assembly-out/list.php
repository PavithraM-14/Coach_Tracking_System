<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
// assembly_out_line_id/slot_id are no longer populated (Assembly In/Out now
// share one line pool tracked via assembly_slot_occupancy) — LEFT JOIN so
// historical rows that do have them still resolve, new rows come back null.
$rows = $pdo->query(
    "SELECT aot.id AS assembly_out_id, c.coach_number, ct.name AS coach_type,
            al.name AS assembly_out_line, s.slot_number, aot.assembly_out_datetime,
            u.full_name AS recorded_by, aot.status
     FROM assembly_out_transactions aot
     JOIN coaches c ON c.id = aot.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     LEFT JOIN assembly_out_lines al ON al.id = aot.assembly_out_line_id
     LEFT JOIN assembly_out_line_slots s ON s.id = aot.slot_id
     JOIN users u ON u.id = aot.recorded_by_user_id
     ORDER BY aot.assembly_out_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'assembly_out_id' => (int) $row['assembly_out_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'assembly_out_line' => $row['assembly_out_line'],
        'slot_number' => $row['slot_number'] !== null ? (int) $row['slot_number'] : null,
        'assembly_out_datetime' => $row['assembly_out_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
    ];
}, $rows);

Response::ok(['data' => $data]);
