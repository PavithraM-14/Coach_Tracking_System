<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$coachTypeId = (int) ($body['coach_type_id'] ?? 0);

if ($coachTypeId <= 0) {
    Response::error('coach_type_id is required.', 400);
}

$fields = [
    'shell_to_furnishing_days',
    'furnishing_to_paint_in_days',
    'paint_in_to_paint_out_days',
    'paint_out_to_assembly_in_days',
    'assembly_in_to_assembly_out_days',
    'assembly_out_to_local_outturn_days',
    'local_outturn_to_dispatch_days',
    'target_total_days',
];

$values = [];
foreach ($fields as $field) {
    $raw = $body[$field] ?? null;
    if (!is_numeric($raw) || (int) $raw < 0) {
        Response::error("{$field} must be a non-negative number.", 400);
    }
    $values[$field] = (int) $raw;
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM coach_types WHERE id = :id');
$stmt->execute(['id' => $coachTypeId]);
if (!$stmt->fetch()) {
    Response::error('Coach type not found.', 404);
}

$pdo->prepare(
    'INSERT INTO fixed_schedules
        (coach_type_id, shell_to_furnishing_days, furnishing_to_paint_in_days, paint_in_to_paint_out_days,
         paint_out_to_assembly_in_days, assembly_in_to_assembly_out_days, assembly_out_to_local_outturn_days,
         local_outturn_to_dispatch_days, target_total_days)
     VALUES (:coach_type_id, :shell_to_furnishing_days, :furnishing_to_paint_in_days, :paint_in_to_paint_out_days,
         :paint_out_to_assembly_in_days, :assembly_in_to_assembly_out_days, :assembly_out_to_local_outturn_days,
         :local_outturn_to_dispatch_days, :target_total_days)
     ON DUPLICATE KEY UPDATE
        shell_to_furnishing_days = VALUES(shell_to_furnishing_days),
        furnishing_to_paint_in_days = VALUES(furnishing_to_paint_in_days),
        paint_in_to_paint_out_days = VALUES(paint_in_to_paint_out_days),
        paint_out_to_assembly_in_days = VALUES(paint_out_to_assembly_in_days),
        assembly_in_to_assembly_out_days = VALUES(assembly_in_to_assembly_out_days),
        assembly_out_to_local_outturn_days = VALUES(assembly_out_to_local_outturn_days),
        local_outturn_to_dispatch_days = VALUES(local_outturn_to_dispatch_days),
        target_total_days = VALUES(target_total_days)'
)->execute(array_merge(['coach_type_id' => $coachTypeId], $values));

Response::ok(['coach_type_id' => $coachTypeId] + $values);
