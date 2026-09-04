<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ASSEMBLY_PRODUCTION']);

$pdo = Db::get();
$stmt = $pdo->prepare(
    "SELECT c.id AS coach_id, c.coach_number, c.serial_no,
            ct.name AS coach_type, cc.name AS coach_category,
            p.name AS plant, py.year_code AS production_year,
            po.bo_number, po.bo_item, po.installation_no
     FROM coach_assignments ca
     JOIN coaches c ON c.id = ca.coach_id
     JOIN production_orders po ON po.id = c.production_order_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN coach_categories cc ON cc.id = ct.category_id
     JOIN plants p ON p.id = po.plant_id
     JOIN production_years py ON py.id = po.production_year_id
     WHERE ca.module = 'ASSEMBLY_IN' AND ca.status = 'ASSIGNED' AND ca.assigned_user_id = :user_id
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
    ];
}, $rows);

Response::ok(['data' => $data]);
