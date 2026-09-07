<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();

$lines = $pdo->query('SELECT id, code, name, total_slots FROM paint_lines WHERE is_active = 1 ORDER BY id')->fetchAll();

// Occupancy comes from paint_slot_occupancy (released_at IS NULL = still
// there right now), not directly from paint_in_transactions — a coach can
// move to a different slot (see move.php) or leave via Paint Out, and the
// permanent paint_in_transactions row never changes, so it can't tell us
// where a coach currently sits.
$slotRows = $pdo->query(
    "SELECT s.id AS slot_id, s.paint_line_id, s.slot_number,
            pso.id AS occupancy_id, pso.coach_id, c.coach_number, u.full_name AS recorded_by
     FROM paint_line_slots s
     LEFT JOIN paint_slot_occupancy pso ON pso.slot_id = s.id AND pso.released_at IS NULL
     LEFT JOIN coaches c ON c.id = pso.coach_id
     LEFT JOIN users u ON u.id = pso.placed_by_user_id
     ORDER BY s.paint_line_id, s.slot_number"
)->fetchAll();

$slotsByLine = [];
foreach ($slotRows as $row) {
    $lineId = (int) $row['paint_line_id'];
    $slotsByLine[$lineId][] = [
        'slot_id' => (int) $row['slot_id'],
        'slot_number' => (int) $row['slot_number'],
        'is_occupied' => $row['occupancy_id'] !== null,
        'coach_id' => $row['coach_id'] !== null ? (int) $row['coach_id'] : null,
        'coach_number' => $row['coach_number'],
        'recorded_by' => $row['recorded_by'],
    ];
}

$data = array_map(function ($line) use ($slotsByLine) {
    $lineId = (int) $line['id'];
    $slots = $slotsByLine[$lineId] ?? [];
    $occupied = count(array_filter($slots, fn ($s) => $s['is_occupied']));
    return [
        'paint_line_id' => $lineId,
        'code' => $line['code'],
        'name' => $line['name'],
        'total_slots' => (int) $line['total_slots'],
        'occupied_slots' => $occupied,
        'slots' => $slots,
    ];
}, $lines);

// "Booked" = coaches assigned to a Paint employee (via the skill queue) that
// haven't been placed in a slot yet — not tied to any specific line/slot.
$bookedCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM coach_assignments WHERE module = 'PAINT' AND status = 'ASSIGNED'"
)->fetchColumn();

Response::ok(['data' => $data, 'booked_count' => $bookedCount]);
