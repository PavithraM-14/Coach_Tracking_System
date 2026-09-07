<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();

$lines = $pdo->query('SELECT id, code, name, total_slots FROM paint_out_lines WHERE is_active = 1 ORDER BY id')->fetchAll();

$slotRows = $pdo->query(
    "SELECT s.id AS slot_id, s.paint_out_line_id, s.slot_number,
            pot.id AS paint_out_id, c.coach_number, u.full_name AS recorded_by
     FROM paint_out_line_slots s
     LEFT JOIN paint_out_transactions pot ON pot.slot_id = s.id
     LEFT JOIN coaches c ON c.id = pot.coach_id
     LEFT JOIN users u ON u.id = pot.recorded_by_user_id
     ORDER BY s.paint_out_line_id, s.slot_number"
)->fetchAll();

$slotsByLine = [];
foreach ($slotRows as $row) {
    $lineId = (int) $row['paint_out_line_id'];
    $slotsByLine[$lineId][] = [
        'slot_id' => (int) $row['slot_id'],
        'slot_number' => (int) $row['slot_number'],
        'is_occupied' => $row['paint_out_id'] !== null,
        'coach_number' => $row['coach_number'],
        'recorded_by' => $row['recorded_by'],
    ];
}

$data = array_map(function ($line) use ($slotsByLine) {
    $lineId = (int) $line['id'];
    $slots = $slotsByLine[$lineId] ?? [];
    $occupied = count(array_filter($slots, fn ($s) => $s['is_occupied']));
    return [
        'paint_out_line_id' => $lineId,
        'code' => $line['code'],
        'name' => $line['name'],
        'total_slots' => (int) $line['total_slots'],
        'occupied_slots' => $occupied,
        'slots' => $slots,
    ];
}, $lines);

// "Booked" = coaches assigned to a Paint employee for Paint Out that haven't
// been placed in a slot yet — not tied to any specific line/slot.
$bookedCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM coach_assignments WHERE module = 'PAINT_OUT' AND status = 'ASSIGNED'"
)->fetchColumn();

Response::ok(['data' => $data, 'booked_count' => $bookedCount]);
