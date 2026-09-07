<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['VENDOR_SNI']);

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT assigned_vendor FROM users WHERE id = :id');
$stmt->execute(['id' => $currentUser['sub']]);
$assignedVendor = $stmt->fetchColumn();

if (!$assignedVendor) {
    // This login isn't scoped to a vendor yet — nothing to show rather than an error.
    Response::ok(['data' => []]);
}

$stmt = $pdo->prepare(
    "SELECT pit.id AS paint_in_id, c.coach_number, ct.name AS coach_type,
            pit.paint_in_datetime, uin.full_name AS paint_in_by,
            pot.paint_out_datetime
     FROM paint_in_transactions pit
     JOIN coaches c ON c.id = pit.coach_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN users uin ON uin.id = pit.recorded_by_user_id
     LEFT JOIN paint_out_transactions pot ON pot.paint_in_id = pit.id
     WHERE pit.vendor = :vendor
     ORDER BY pit.paint_in_datetime DESC"
);
$stmt->execute(['vendor' => $assignedVendor]);
$rows = $stmt->fetchAll();

Response::ok([
    'data' => array_map(fn ($row) => [
        'paint_in_id' => (int) $row['paint_in_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'paint_in_datetime' => $row['paint_in_datetime'],
        'paint_in_by' => $row['paint_in_by'],
        'paint_out_datetime' => $row['paint_out_datetime'],
        'status' => $row['paint_out_datetime'] !== null ? 'Moved to Paint Out' : 'At Paint In',
    ], $rows),
]);
