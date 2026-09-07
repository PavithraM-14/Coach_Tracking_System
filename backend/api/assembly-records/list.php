<?php

require_once __DIR__ . '/../../bootstrap.php';

// Combined Assembly In + Assembly Out record — replaces the separate
// Assembly In Records / Assembly Out Records pages.
Auth::currentUser();

$pdo = Db::get();

$rows = $pdo->query(
    "SELECT ait.id AS assembly_in_id, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
            ait.assembly_in_datetime, uin.full_name AS assembly_in_by,
            aot.assembly_out_datetime, uout.full_name AS assembly_out_by
     FROM assembly_in_transactions ait
     JOIN coaches c ON c.id = ait.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users uin ON uin.id = ait.recorded_by_user_id
     LEFT JOIN assembly_out_transactions aot ON aot.assembly_in_id = ait.id
     LEFT JOIN users uout ON uout.id = aot.recorded_by_user_id
     ORDER BY ait.assembly_in_datetime DESC"
)->fetchAll();

$historyRows = $pdo->query(
    "SELECT aso.assembly_in_id, al.name AS assembly_line, s.slot_number,
            aso.occupied_from, aso.released_at, u.full_name AS placed_by
     FROM assembly_slot_occupancy aso
     JOIN assembly_in_line_slots s ON s.id = aso.slot_id
     JOIN assembly_in_lines al ON al.id = s.assembly_in_line_id
     JOIN users u ON u.id = aso.placed_by_user_id
     ORDER BY aso.assembly_in_id, aso.occupied_from"
)->fetchAll();

$historyByAssemblyIn = [];
foreach ($historyRows as $row) {
    $historyByAssemblyIn[(int) $row['assembly_in_id']][] = [
        'assembly_line' => $row['assembly_line'],
        'slot_number' => (int) $row['slot_number'],
        'occupied_from' => $row['occupied_from'],
        'released_at' => $row['released_at'],
        'placed_by' => $row['placed_by'],
    ];
}

$data = array_map(function ($row) use ($historyByAssemblyIn) {
    $assemblyInId = (int) $row['assembly_in_id'];
    $history = $historyByAssemblyIn[$assemblyInId] ?? [];
    $current = end($history) ?: null;
    return [
        'assembly_in_id' => $assemblyInId,
        'coach_id' => (int) $row['coach_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'assembly_in_datetime' => $row['assembly_in_datetime'],
        'assembly_in_by' => $row['assembly_in_by'],
        'assembly_out_datetime' => $row['assembly_out_datetime'],
        'assembly_out_by' => $row['assembly_out_by'],
        'current_line' => $current['assembly_line'] ?? null,
        'current_slot_number' => $current['slot_number'] ?? null,
        'line_history' => $history,
    ];
}, $rows);

Response::ok(['data' => $data]);
