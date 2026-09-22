<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['OUTTURN_DISPATCH']);

$pdo = Db::get();
$stmt = $pdo->prepare(
    "SELECT c.id AS coach_id, c.coach_number, c.serial_no,
            ct.name AS coach_type, cc.name AS coach_category,
            p.name AS plant, py.year_code AS production_year,
            po.bo_number, po.bo_item, po.installation_no,
            prior.lock_seal_datetime AS lock_seal_datetime,
            lor.outturn_serial_no AS outturn_serial_no,
            lor.railway AS railway,
            lor.local_outturn_datetime AS local_outturn_datetime,
            fs.local_outturn_to_dispatch_days
     FROM coach_assignments ca
     JOIN coaches c ON c.id = ca.coach_id
     JOIN production_orders po ON po.id = c.production_order_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN coach_categories cc ON cc.id = ct.category_id
     JOIN plants p ON p.id = po.plant_id
     JOIN production_years py ON py.id = po.production_year_id
     JOIN lock_seal_records prior ON prior.coach_id = c.id
     JOIN local_outturn_records lor ON lor.coach_id = c.id
     LEFT JOIN fixed_schedules fs ON fs.coach_type_id = c.coach_type_id
     WHERE ca.module = 'BOARD_OUTTURN' AND ca.status = 'ASSIGNED' AND ca.assigned_user_id = :user_id
     ORDER BY c.coach_number"
);
$stmt->execute(['user_id' => $currentUser['sub']]);
$rows = $stmt->fetchAll();

$data = array_map(function ($row) {
    return [
        'coach_id' => (int) $row['coach_id'],
        'coach_number' => $row['coach_number'],
        'serial_no' => $row['serial_no'],
        'coach_type' => $row['coach_type'],
        'coach_category' => $row['coach_category'],
        'plant' => $row['plant'],
        'production_year' => $row['production_year'],
        'bo_number' => $row['bo_number'],
        'bo_item' => (int) $row['bo_item'],
        'installation_no' => $row['installation_no'],
        'lock_seal_datetime' => $row['lock_seal_datetime'],
        'outturn_serial_no' => $row['outturn_serial_no'],
        'railway' => $row['railway'],
        'predicted_date' => Schedule::addDays(
            $row['local_outturn_datetime'],
            $row['local_outturn_to_dispatch_days'] !== null ? (int) $row['local_outturn_to_dispatch_days'] : null
        ),
    ];
}, $rows);

Response::ok(['data' => $data]);
