<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::currentUser(); // any authenticated role may view

$pdo = Db::get();

$lines = $pdo->query('SELECT id, code, name, total_slots FROM assembly_out_lines WHERE is_active = 1 ORDER BY id')->fetchAll();

$slotRows = $pdo->query(
    "SELECT s.id AS slot_id, s.assembly_out_line_id, s.slot_number,
            aot.id AS assembly_out_id, c.coach_number
     FROM assembly_out_line_slots s
     LEFT JOIN assembly_out_transactions aot ON aot.slot_id = s.id
     LEFT JOIN coaches c ON c.id = aot.coach_id
     ORDER BY s.assembly_out_line_id, s.slot_number"
)->fetchAll();

$slotsByLine = [];
foreach ($slotRows as $row) {
    $lineId = (int) $row['assembly_out_line_id'];
    $slotsByLine[$lineId][] = [
        'slot_id' => (int) $row['slot_id'],
        'slot_number' => (int) $row['slot_number'],
        'is_occupied' => $row['assembly_out_id'] !== null,
        'coach_number' => $row['coach_number'],
    ];
}

$data = array_map(function ($line) use ($slotsByLine) {
    $lineId = (int) $line['id'];
    $slots = $slotsByLine[$lineId] ?? [];
    $occupied = count(array_filter($slots, fn ($s) => $s['is_occupied']));
    return [
        'assembly_out_line_id' => $lineId,
        'code' => $line['code'],
        'name' => $line['name'],
        'total_slots' => (int) $line['total_slots'],
        'occupied_slots' => $occupied,
        'slots' => $slots,
    ];
}, $lines);

$bookedCount = (int) $pdo->query(
    "SELECT COUNT(*) FROM coach_assignments WHERE module = 'ASSEMBLY_OUT' AND status = 'ASSIGNED'"
)->fetchColumn();

Response::ok(['data' => $data, 'booked_count' => $bookedCount]);
