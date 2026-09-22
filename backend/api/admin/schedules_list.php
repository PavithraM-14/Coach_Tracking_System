<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();

$q = trim((string) ($_GET['q'] ?? ''));

$sql = "SELECT ct.id AS coach_type_id, ct.code, ct.name, ct.is_lhb,
               cc.id AS category_id, cc.name AS category_name,
               fs.shell_to_furnishing_days, fs.furnishing_to_paint_in_days, fs.paint_in_to_paint_out_days,
               fs.paint_out_to_assembly_in_days, fs.assembly_in_to_assembly_out_days,
               fs.assembly_out_to_local_outturn_days, fs.local_outturn_to_dispatch_days, fs.target_total_days
        FROM coach_types ct
        JOIN coach_categories cc ON cc.id = ct.category_id
        LEFT JOIN fixed_schedules fs ON fs.coach_type_id = ct.id";
$params = [];
if ($q !== '') {
    // PDO+mysqlnd rejects reusing the same named placeholder twice when
    // PDO::ATTR_EMULATE_PREPARES is off (as configured in Db.php) — bind the
    // same value to two distinct placeholders instead.
    $sql .= ' WHERE ct.name LIKE :q1 OR ct.code LIKE :q2';
    $params['q1'] = "%{$q}%";
    $params['q2'] = "%{$q}%";
}
$sql .= ' ORDER BY ct.name';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$data = array_map(function ($r) {
    return [
        'coach_type_id' => (int) $r['coach_type_id'],
        'code' => $r['code'],
        'name' => $r['name'],
        'is_lhb' => (bool) $r['is_lhb'],
        'category_id' => (int) $r['category_id'],
        'category_name' => $r['category_name'],
        'shell_to_furnishing_days' => $r['shell_to_furnishing_days'] !== null ? (int) $r['shell_to_furnishing_days'] : null,
        'furnishing_to_paint_in_days' => $r['furnishing_to_paint_in_days'] !== null ? (int) $r['furnishing_to_paint_in_days'] : null,
        'paint_in_to_paint_out_days' => $r['paint_in_to_paint_out_days'] !== null ? (int) $r['paint_in_to_paint_out_days'] : null,
        'paint_out_to_assembly_in_days' => $r['paint_out_to_assembly_in_days'] !== null ? (int) $r['paint_out_to_assembly_in_days'] : null,
        'assembly_in_to_assembly_out_days' => $r['assembly_in_to_assembly_out_days'] !== null ? (int) $r['assembly_in_to_assembly_out_days'] : null,
        'assembly_out_to_local_outturn_days' => $r['assembly_out_to_local_outturn_days'] !== null ? (int) $r['assembly_out_to_local_outturn_days'] : null,
        'local_outturn_to_dispatch_days' => $r['local_outturn_to_dispatch_days'] !== null ? (int) $r['local_outturn_to_dispatch_days'] : null,
        'target_total_days' => $r['target_total_days'] !== null ? (int) $r['target_total_days'] : null,
    ];
}, $rows);

Response::ok(['data' => $data]);
