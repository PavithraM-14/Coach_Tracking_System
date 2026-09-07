<?php

require_once __DIR__ . '/../../bootstrap.php';

// Combined Paint In + Paint Out record — replaces the separate Paint In
// Records / Paint Out Records pages. Any authenticated role may view (same
// as the old list.php endpoints).
Auth::currentUser();

$pdo = Db::get();

$rows = $pdo->query(
    "SELECT pit.id AS paint_in_id, c.id AS coach_id, c.coach_number, ct.name AS coach_type,
            pit.paint_in_datetime, uin.full_name AS paint_in_by,
            pot.paint_out_datetime, uout.full_name AS paint_out_by
     FROM paint_in_transactions pit
     JOIN coaches c ON c.id = pit.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users uin ON uin.id = pit.recorded_by_user_id
     LEFT JOIN paint_out_transactions pot ON pot.paint_in_id = pit.id
     LEFT JOIN users uout ON uout.id = pot.recorded_by_user_id
     ORDER BY pit.paint_in_datetime DESC"
)->fetchAll();

// One coach's full stay history (every slot it has occupied, in order) — a
// coach that was never moved has exactly one row here.
$historyRows = $pdo->query(
    "SELECT pso.paint_in_id, pl.name AS paint_line, s.slot_number,
            pso.occupied_from, pso.released_at, u.full_name AS placed_by
     FROM paint_slot_occupancy pso
     JOIN paint_line_slots s ON s.id = pso.slot_id
     JOIN paint_lines pl ON pl.id = s.paint_line_id
     JOIN users u ON u.id = pso.placed_by_user_id
     ORDER BY pso.paint_in_id, pso.occupied_from"
)->fetchAll();

$historyByPaintIn = [];
foreach ($historyRows as $row) {
    $historyByPaintIn[(int) $row['paint_in_id']][] = [
        'paint_line' => $row['paint_line'],
        'slot_number' => (int) $row['slot_number'],
        'occupied_from' => $row['occupied_from'],
        'released_at' => $row['released_at'],
        'placed_by' => $row['placed_by'],
    ];
}

$data = array_map(function ($row) use ($historyByPaintIn) {
    $paintInId = (int) $row['paint_in_id'];
    $history = $historyByPaintIn[$paintInId] ?? [];
    $current = end($history) ?: null;
    return [
        'paint_in_id' => $paintInId,
        'coach_id' => (int) $row['coach_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'paint_in_datetime' => $row['paint_in_datetime'],
        'paint_in_by' => $row['paint_in_by'],
        'paint_out_datetime' => $row['paint_out_datetime'],
        'paint_out_by' => $row['paint_out_by'],
        'current_line' => $current['paint_line'] ?? null,
        'current_slot_number' => $current['slot_number'] ?? null,
        'line_history' => $history,
    ];
}, $rows);

Response::ok(['data' => $data]);
