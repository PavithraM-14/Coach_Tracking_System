<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();
$rows = $pdo->query(
    "SELECT po.id, po.bo_number, po.bo_item, po.bo_date, po.bo_qty, po.from_serial, po.to_serial,
            po.installation_no, po.status, p.name AS plant, py.year_code AS production_year,
            ct.name AS coach_type, po.created_at,
            (SELECT COUNT(*) FROM coaches c WHERE c.production_order_id = po.id) AS coach_count
     FROM production_orders po
     JOIN plants p ON p.id = po.plant_id
     JOIN production_years py ON py.id = po.production_year_id
     JOIN coach_types ct ON ct.id = po.coach_type_id
     ORDER BY po.created_at DESC"
)->fetchAll();

$data = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        'bo_number' => $row['bo_number'],
        'bo_item' => (int) $row['bo_item'],
        'bo_date' => $row['bo_date'],
        'bo_qty' => (int) $row['bo_qty'],
        'from_serial' => $row['from_serial'],
        'to_serial' => $row['to_serial'],
        'installation_no' => $row['installation_no'],
        'status' => $row['status'],
        'plant' => $row['plant'],
        'production_year' => $row['production_year'],
        'coach_type' => $row['coach_type'],
        'coach_count' => (int) $row['coach_count'],
        'created_at' => $row['created_at'],
    ];
}, $rows);

Response::ok(['data' => $data]);
