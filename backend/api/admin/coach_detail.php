<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

Auth::requireRole(['ADMIN']);

$coachId = (int) ($_GET['coach_id'] ?? 0);
if ($coachId <= 0) {
    Response::error('coach_id is required.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare(
    'SELECT c.id AS coach_id, c.coach_number, c.serial_no,
            ct.name AS coach_type, cc.name AS coach_category,
            p.name AS plant, py.year_code AS production_year,
            po.bo_number, po.bo_item, po.installation_no
     FROM coaches c
     JOIN production_orders po ON po.id = c.production_order_id
     JOIN coach_types ct ON ct.id = c.coach_type_id
     JOIN coach_categories cc ON cc.id = ct.category_id
     JOIN plants p ON p.id = po.plant_id
     JOIN production_years py ON py.id = po.production_year_id
     WHERE c.id = :coach_id'
);
$stmt->execute(['coach_id' => $coachId]);
$coach = $stmt->fetch();
if (!$coach) {
    Response::error('Coach not found.', 404);
}

// Ordered pipeline: each entry is [module-after-completion, stage label,
// query for the row (if it exists) once that stage is done].
$stmt = $pdo->prepare(
    'SELECT sot.id, sot.outturn_datetime AS occurred_at, sot.remarks, u.full_name AS recorded_by
     FROM shell_outturn_transactions sot JOIN users u ON u.id = sot.recorded_by_user_id
     WHERE sot.coach_id = :coach_id'
);
$stmt->execute(['coach_id' => $coachId]);
$shellOutturn = $stmt->fetch();

$stmt = $pdo->prepare(
    'SELECT fir.id, fir.furnishing_in_datetime AS occurred_at, fir.remarks, u.full_name AS recorded_by
     FROM furnishing_in_records fir JOIN users u ON u.id = fir.recorded_by_user_id
     WHERE fir.coach_id = :coach_id'
);
$stmt->execute(['coach_id' => $coachId]);
$furnishingIn = $stmt->fetch();

$stmt = $pdo->prepare(
    "SELECT pit.id, pit.paint_in_datetime AS occurred_at, pit.remarks, u.full_name AS recorded_by,
            pl.name AS line_name, s.slot_number
     FROM paint_in_transactions pit
     JOIN users u ON u.id = pit.recorded_by_user_id
     JOIN paint_lines pl ON pl.id = pit.paint_line_id
     JOIN paint_line_slots s ON s.id = pit.slot_id
     WHERE pit.coach_id = :coach_id"
);
$stmt->execute(['coach_id' => $coachId]);
$paintIn = $stmt->fetch();

$stmt = $pdo->prepare(
    "SELECT pot.id, pot.paint_out_datetime AS occurred_at, pot.remarks, u.full_name AS recorded_by,
            pl.name AS line_name, s.slot_number
     FROM paint_out_transactions pot
     JOIN users u ON u.id = pot.recorded_by_user_id
     JOIN paint_out_lines pl ON pl.id = pot.paint_out_line_id
     JOIN paint_out_line_slots s ON s.id = pot.slot_id
     WHERE pot.coach_id = :coach_id"
);
$stmt->execute(['coach_id' => $coachId]);
$paintOut = $stmt->fetch();

$stmt = $pdo->prepare(
    "SELECT ait.id, ait.assembly_in_datetime AS occurred_at, ait.remarks, u.full_name AS recorded_by,
            al.name AS line_name, s.slot_number
     FROM assembly_in_transactions ait
     JOIN users u ON u.id = ait.recorded_by_user_id
     JOIN assembly_in_lines al ON al.id = ait.assembly_in_line_id
     JOIN assembly_in_line_slots s ON s.id = ait.slot_id
     WHERE ait.coach_id = :coach_id"
);
$stmt->execute(['coach_id' => $coachId]);
$assemblyIn = $stmt->fetch();

$stmt = $pdo->prepare(
    "SELECT aot.id, aot.assembly_out_datetime AS occurred_at, aot.remarks, u.full_name AS recorded_by,
            al.name AS line_name, s.slot_number
     FROM assembly_out_transactions aot
     JOIN users u ON u.id = aot.recorded_by_user_id
     JOIN assembly_out_lines al ON al.id = aot.assembly_out_line_id
     JOIN assembly_out_line_slots s ON s.id = aot.slot_id
     WHERE aot.coach_id = :coach_id"
);
$stmt->execute(['coach_id' => $coachId]);
$assemblyOut = $stmt->fetch();

// PDOStatement::fetch() returns false (not null) when no row matched.
function historyEntry(string $stage, $row): ?array
{
    if (!$row) {
        return null;
    }
    $entry = [
        'stage' => $stage,
        'occurred_at' => $row['occurred_at'],
        'recorded_by' => $row['recorded_by'],
        'remarks' => $row['remarks'],
    ];
    if (isset($row['line_name'])) {
        $entry['location'] = $row['line_name'] . ', slot ' . $row['slot_number'];
    }
    return $entry;
}

$history = array_values(array_filter([
    historyEntry('Shell Outturn', $shellOutturn),
    historyEntry('Furnishing In', $furnishingIn),
    historyEntry('Paint In', $paintIn),
    historyEntry('Paint Out', $paintOut),
    historyEntry('Assembly In', $assemblyIn),
    historyEntry('Assembly Out', $assemblyOut),
]));

// Pipeline stage completion, in order, drives both "where is the coach now"
// and the workflow stepper the frontend renders.
$stages = [
    ['key' => 'SHELL_OUTTURN', 'label' => 'Shell Outturn', 'done' => (bool) $shellOutturn],
    ['key' => 'FURNISHING_IN', 'label' => 'Furnishing In', 'done' => (bool) $furnishingIn],
    ['key' => 'PAINT_IN', 'label' => 'Paint In', 'done' => (bool) $paintIn],
    ['key' => 'PAINT_OUT', 'label' => 'Paint Out', 'done' => (bool) $paintOut],
    ['key' => 'ASSEMBLY_IN', 'label' => 'Assembly In', 'done' => (bool) $assemblyIn],
    ['key' => 'ASSEMBLY_OUT', 'label' => 'Assembly Out', 'done' => (bool) $assemblyOut],
];

// The module (coach_assignments) that would own the NEXT action, based on
// which stage is the first not-yet-done one — mirrors the assignOrQueue()
// chain in each stage's create.php.
$nextModuleByStage = [
    'SHELL_OUTTURN' => null, // no assignment queue for Shell Outturn itself
    'FURNISHING_IN' => 'FURNISHING',
    'PAINT_IN' => 'PAINT',
    'PAINT_OUT' => 'PAINT_OUT',
    'ASSEMBLY_IN' => 'ASSEMBLY_IN',
    'ASSEMBLY_OUT' => 'ASSEMBLY_OUT',
];

$currentStageKey = null;
foreach ($stages as $s) {
    if (!$s['done']) {
        $currentStageKey = $s['key'];
        break;
    }
}

$location = null;
if ($currentStageKey === null) {
    $location = ['status' => 'COMPLETED', 'label' => 'Pipeline complete — Assembly Out done', 'held_by' => null];
} else {
    $module = $nextModuleByStage[$currentStageKey];
    if ($module === null) {
        $location = ['status' => 'PENDING', 'label' => 'Awaiting Shell Outturn', 'held_by' => null];
    } else {
        $stmt = $pdo->prepare(
            "SELECT ca.status, u.full_name AS assigned_to
             FROM coach_assignments ca
             LEFT JOIN users u ON u.id = ca.assigned_user_id
             WHERE ca.coach_id = :coach_id AND ca.module = :module"
        );
        $stmt->execute(['coach_id' => $coachId, 'module' => $module]);
        $assignment = $stmt->fetch();
        $stageLabel = $stages[array_search($currentStageKey, array_column($stages, 'key'))]['label'];
        if ($assignment && $assignment['status'] === 'ASSIGNED') {
            $location = [
                'status' => 'ASSIGNED',
                'label' => "Awaiting $stageLabel — with {$assignment['assigned_to']}",
                'held_by' => $assignment['assigned_to'],
            ];
        } elseif ($assignment && $assignment['status'] === 'QUEUED') {
            $location = ['status' => 'QUEUED', 'label' => "Awaiting $stageLabel — queued, no employee assigned yet", 'held_by' => null];
        } else {
            $location = ['status' => 'PENDING', 'label' => "Awaiting $stageLabel", 'held_by' => null];
        }
    }
}

Response::ok([
    'coach' => [
        'coach_id' => (int) $coach['coach_id'],
        'coach_number' => $coach['coach_number'],
        'serial_no' => $coach['serial_no'],
        'coach_type' => $coach['coach_type'],
        'coach_category' => $coach['coach_category'],
        'plant' => $coach['plant'],
        'production_year' => $coach['production_year'],
        'bo_number' => $coach['bo_number'],
        'bo_item' => (int) $coach['bo_item'],
        'installation_no' => $coach['installation_no'],
    ],
    'location' => $location,
    'stages' => array_map(fn ($s) => ['key' => $s['key'], 'label' => $s['label'], 'done' => $s['done']], $stages),
    'history' => $history,
]);
