<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT lsr.id AS lock_seal_id, c.coach_number, ct.name AS coach_type,
            lsr.lock_seal_datetime, u.full_name AS recorded_by, lsr.status
     FROM lock_seal_records lsr
     JOIN coaches c ON c.id = lsr.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users u ON u.id = lsr.recorded_by_user_id
     ORDER BY lsr.lock_seal_datetime DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'lock_seal_id' => (int) $row['lock_seal_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'lock_seal_datetime' => $row['lock_seal_datetime'],
        'recorded_by' => $row['recorded_by'],
        'status' => $row['status'],
    ];
}, $rows);

Response::ok(['data' => $data]);
