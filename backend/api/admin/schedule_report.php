<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();

$q = trim((string) ($_GET['q'] ?? ''));

// One row per coach, every stage's actual datetime (or NULL) plus that
// coach type's fixed_schedules row (or NULL if none) — all 1:1 LEFT JOINs
// (coach_id is UNIQUE on every stage table), so no row multiplication risk.
$sql = "SELECT c.id AS coach_id, c.coach_number, ct.name AS coach_type,
               sot.outturn_datetime AS shell_outturn_datetime,
               fir.furnishing_in_datetime, pit.paint_in_datetime, pot.paint_out_datetime,
               ait.assembly_in_datetime, aot.assembly_out_datetime, lor.local_outturn_datetime,
               lsr.lock_seal_datetime, bor.board_outturn_datetime, pdr.dispatch_datetime,
               fs.shell_to_furnishing_days, fs.furnishing_to_paint_in_days, fs.paint_in_to_paint_out_days,
               fs.paint_out_to_assembly_in_days, fs.assembly_in_to_assembly_out_days,
               fs.assembly_out_to_local_outturn_days, fs.local_outturn_to_dispatch_days
        FROM coaches c
        JOIN coach_types ct ON ct.id = c.coach_type_id
        LEFT JOIN fixed_schedules fs ON fs.coach_type_id = ct.id
        LEFT JOIN shell_outturn_transactions sot ON sot.coach_id = c.id
        LEFT JOIN furnishing_in_records fir ON fir.coach_id = c.id
        LEFT JOIN paint_in_transactions pit ON pit.coach_id = c.id
        LEFT JOIN paint_out_transactions pot ON pot.coach_id = c.id
        LEFT JOIN assembly_in_transactions ait ON ait.coach_id = c.id
        LEFT JOIN assembly_out_transactions aot ON aot.coach_id = c.id
        LEFT JOIN local_outturn_records lor ON lor.coach_id = c.id
        LEFT JOIN lock_seal_records lsr ON lsr.coach_id = c.id
        LEFT JOIN board_outturn_records bor ON bor.coach_id = c.id
        LEFT JOIN physical_dispatch_records pdr ON pdr.coach_id = c.id";
$params = [];
if ($q !== '') {
    // PDO+mysqlnd rejects reusing the same named placeholder twice when
    // PDO::ATTR_EMULATE_PREPARES is off (as configured in Db.php) — bind the
    // same value to two distinct placeholders instead.
    $sql .= ' WHERE c.coach_number LIKE :q1 OR ct.name LIKE :q2';
    $params['q1'] = "%{$q}%";
    $params['q2'] = "%{$q}%";
}
$sql .= ' ORDER BY c.coach_number';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$scheduleColumns = [
    'shell_to_furnishing_days', 'furnishing_to_paint_in_days', 'paint_in_to_paint_out_days',
    'paint_out_to_assembly_in_days', 'assembly_in_to_assembly_out_days',
    'assembly_out_to_local_outturn_days', 'local_outturn_to_dispatch_days',
];

$data = array_map(function ($row) use ($scheduleColumns) {
    $actuals = [
        'SHELL_OUTTURN' => $row['shell_outturn_datetime'],
        'FURNISHING_IN' => $row['furnishing_in_datetime'],
        'PAINT_IN' => $row['paint_in_datetime'],
        'PAINT_OUT' => $row['paint_out_datetime'],
        'ASSEMBLY_IN' => $row['assembly_in_datetime'],
        'ASSEMBLY_OUT' => $row['assembly_out_datetime'],
        'LOCAL_OUTTURN' => $row['local_outturn_datetime'],
        'LOCK_SEAL' => $row['lock_seal_datetime'],
        'BOARD_OUTTURN' => $row['board_outturn_datetime'],
        'PHYSICAL_DISPATCH' => $row['dispatch_datetime'],
    ];

    $scheduleDays = null;
    if ($row['shell_to_furnishing_days'] !== null) {
        $scheduleDays = [];
        foreach ($scheduleColumns as $col) {
            $scheduleDays[$col] = $row[$col];
        }
    }

    $comparison = ScheduleReport::compare($actuals, $scheduleDays);

    return [
        'coach_id' => (int) $row['coach_id'],
        'coach_number' => $row['coach_number'],
        'coach_type' => $row['coach_type'],
        'shell_outturn_date' => $row['shell_outturn_datetime'] !== null ? substr($row['shell_outturn_datetime'], 0, 10) : null,
        'stages' => $comparison['stages'],
        'scheduled_total_days' => $comparison['scheduled_total_days'],
        'actual_total_days' => $comparison['actual_total_days'],
    ];
}, $rows);

Response::ok(['data' => $data]);
