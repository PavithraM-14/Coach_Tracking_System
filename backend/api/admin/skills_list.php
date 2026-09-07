<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

$pdo = Db::get();

// Assembly Admin only ever sees/assigns the three Assembly Operation
// skill families it manages (split by department) — never the
// Furnishing/Outturn-Dispatch skills that belong to other shops.
$assemblyOpRoles = ['ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION'];
$sql = "SELECT s.id, s.name, s.operation, s.role_code, cc.id AS coach_category_id, cc.name AS coach_category_name
        FROM skills s
        JOIN coach_categories cc ON cc.id = s.coach_category_id
        LEFT JOIN assembly_operations ao ON ao.code = s.operation AND s.role_code IN ('" . implode("','", $assemblyOpRoles) . "')";
$params = [];
if ($currentUser['role'] === 'ASSEMBLY_ADMIN') {
    $sql .= ' WHERE s.role_code IN (' . implode(',', array_fill(0, count($assemblyOpRoles), '?')) . ')';
    $params = $assemblyOpRoles;
}
$sql .= ' ORDER BY COALESCE(ao.sort_order, 999), s.operation, cc.name';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$data = array_map(function ($row) {
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'operation' => $row['operation'],
        'role_code' => $row['role_code'],
        'coach_category_id' => (int) $row['coach_category_id'],
        'coach_category_name' => $row['coach_category_name'],
    ];
}, $rows);

Response::ok(['data' => $data]);
