<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT ait.id AS assembly_in_id, c.coach_number, ct.name AS coach_type,
            al.name AS assembly_in_line, s.slot_number, ait.assembly_in_datetime,
            u.full_name AS recorded_by, ait.status
     FROM assembly_in_transactions ait
     JOIN coaches c ON c.id = ait.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN assembly_in_lines al ON al.id = ait.assembly_in_line_id
     JOIN assembly_in_line_slots s ON s.id = ait.slot_id
     JOIN users u ON u.id = ait.recorded_by_user_id
     ORDER BY ait.assembly_in_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'assembly_in_id' => (int) $row['assembly_in_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'assembly_in_line' => $row['assembly_in_line'],
        'slot_number' => (int) $row['slot_number'],
        'assembly_in_datetime' => $row['assembly_in_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
    ];
}, $rows);

Response::ok(['data' => $data]);
