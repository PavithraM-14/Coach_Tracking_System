<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();

// Blocked (is_active = 0) lines are still returned — Admin/Assembly Admin
// block a line here when there's a physical problem, and the Assembly In
// entry pages need to see and grey it out rather than have it silently vanish.
$lines = $pdo->query('SELECT id, code, name, total_slots, is_active FROM assembly_in_lines ORDER BY id')->fetchAll();

// Occupancy comes from assembly_slot_occupancy (released_at IS NULL = still
// there now) — see paint-in/lines.php for why (slot reuse after a coach
// leaves via Assembly Out, or moves elsewhere before that).
$slotRows = $pdo->query(
    "SELECT s.id AS slot_id, s.assembly_in_line_id, s.slot_number, s.is_active,
            aso.id AS occupancy_id, aso.coach_id, c.coach_number, u.full_name AS recorded_by
     FROM assembly_in_line_slots s
     LEFT JOIN assembly_slot_occupancy aso ON aso.slot_id = s.id AND aso.released_at IS NULL
     LEFT JOIN coaches c ON c.id = aso.coach_id
     LEFT JOIN users u ON u.id = aso.placed_by_user_id
     ORDER BY s.assembly_in_line_id, s.slot_number"
)->fetchAll();

$slotsByLine = [];
foreach ($slotRows as $row) {
    $lineId = (int) $row['assembly_in_line_id'];
    $slotsByLine[$lineId][] = [
        'slot_id' => (int) $row['slot_id'],
        'slot_number' => (int) $row['slot_number'],
        'is_occupied' => $row['occupancy_id'] !== null,
        'is_active' => (bool) $row['is_active'],
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
        'assembly_in_line_id' => $lineId,
        'code' => $line['code'],
        'name' => $line['name'],
        'total_slots' => (int) $line['total_slots'],
        'occupied_slots' => $occupied,
        'is_active' => (bool) $line['is_active'],
        'slots' => $slots,
    ];
}, $lines);

$bookedCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM coach_assignments WHERE module = 'ASSEMBLY_IN' AND status = 'ASSIGNED'"
)->fetchColumn();

Response::ok(['data' => $data, 'booked_count' => $bookedCount]);
