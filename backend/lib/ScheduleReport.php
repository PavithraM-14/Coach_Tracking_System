<?php

// Turns a coach's actual per-stage dates into a Scheduled-vs-Actual
// comparison, using the exact same "prior stage's actual date + that
// transition's fixed_schedules days" definition already shown as each
// stage's own "Predicted Date" at data-entry time (see Schedule::addDays) —
// this is a pure function so both the bulk report and the single-coach
// drill-down can feed it whatever actual dates they already have on hand,
// with no SQL of its own.
class ScheduleReport
{
    // Everything after Shell Outturn, which has no incoming target (the
    // schedule only covers Furnishing In onward).
    const STAGE_KEYS = [
        'FURNISHING_IN', 'PAINT_IN', 'PAINT_OUT', 'ASSEMBLY_IN', 'ASSEMBLY_OUT',
        'LOCAL_OUTTURN', 'LOCK_SEAL', 'BOARD_OUTTURN', 'PHYSICAL_DISPATCH',
    ];

    const STAGE_LABELS = [
        'FURNISHING_IN' => 'Furnishing In',
        'PAINT_IN' => 'Paint In',
        'PAINT_OUT' => 'Paint Out',
        'ASSEMBLY_IN' => 'Assembly In',
        'ASSEMBLY_OUT' => 'Assembly Out',
        'LOCAL_OUTTURN' => 'Local Outturn',
        'LOCK_SEAL' => 'Lock & Seal',
        'BOARD_OUTTURN' => 'Railway Board Outturn',
        'PHYSICAL_DISPATCH' => 'Physical Dispatch',
    ];

    // stage key => the fixed_schedules column covering the gap BEFORE it.
    // Lock & Seal / Board Outturn / Physical Dispatch all share one bucket
    // (local_outturn_to_dispatch_days) — the source schedule doesn't break
    // that stretch down further, so all three compare against the same
    // target date.
    const SCHEDULE_COLUMN = [
        'FURNISHING_IN' => 'shell_to_furnishing_days',
        'PAINT_IN' => 'furnishing_to_paint_in_days',
        'PAINT_OUT' => 'paint_in_to_paint_out_days',
        'ASSEMBLY_IN' => 'paint_out_to_assembly_in_days',
        'ASSEMBLY_OUT' => 'assembly_in_to_assembly_out_days',
        'LOCAL_OUTTURN' => 'assembly_out_to_local_outturn_days',
        'LOCK_SEAL' => 'local_outturn_to_dispatch_days',
        'BOARD_OUTTURN' => 'local_outturn_to_dispatch_days',
        'PHYSICAL_DISPATCH' => 'local_outturn_to_dispatch_days',
    ];

    /**
     * @param array $actuals ['SHELL_OUTTURN' => datetime|null, 'FURNISHING_IN' => datetime|null, ... 'PHYSICAL_DISPATCH' => datetime|null],
     *                        always in that fixed stage order.
     * @param array|null $scheduleDays the coach type's fixed_schedules row (assoc, day-count columns), or null if none exists.
     */
    // Stages that anchor to Local Outturn directly rather than chaining
    // through each other's own actual/scheduled date — see SCHEDULE_COLUMN.
    const DISPATCH_STAGES = ['LOCK_SEAL', 'BOARD_OUTTURN', 'PHYSICAL_DISPATCH'];

    public static function compare(array $actuals, ?array $scheduleDays): array
    {
        $today = date('Y-m-d');
        $prior = $actuals['SHELL_OUTTURN'] ?? null; // chain starts at Shell Outturn's actual date
        $dispatchAnchor = null; // set once Local Outturn is processed
        $scheduledTotalDays = 0;
        $countedColumns = [];

        // Shell Outturn has no incoming target of its own (the schedule only
        // covers Furnishing In onward) — shown as a reference actual-date
        // column, not a scheduled/actual comparison.
        $stages = [[
            'key' => 'SHELL_OUTTURN',
            'label' => 'Shell Outturn',
            'scheduled_date' => null,
            'actual_date' => $prior !== null ? substr($prior, 0, 10) : null,
            'status' => $prior !== null ? 'reference' : 'pending',
        ]];

        foreach (self::STAGE_KEYS as $key) {
            $days = $scheduleDays !== null ? (int) $scheduleDays[self::SCHEDULE_COLUMN[$key]] : null;
            $base = in_array($key, self::DISPATCH_STAGES, true) ? $dispatchAnchor : $prior;
            $scheduled = ($base !== null && $days !== null) ? Schedule::addDays($base, $days) : null;
            $actualDateOnly = ($actuals[$key] ?? null) !== null ? substr($actuals[$key], 0, 10) : null;

            if ($actualDateOnly !== null && $scheduled !== null) {
                $status = $actualDateOnly <= $scheduled ? 'on_time' : 'delayed';
            } elseif ($actualDateOnly !== null) {
                $status = 'on_time'; // no schedule row to compare against — nothing to flag
            } elseif ($scheduled !== null && $scheduled < $today) {
                $status = 'overdue'; // not done, and already past its target — worth flagging over plain "pending"
            } else {
                $status = 'pending';
            }

            $stages[] = [
                'key' => $key,
                'label' => self::STAGE_LABELS[$key],
                'scheduled_date' => $scheduled,
                'actual_date' => $actualDateOnly,
                'status' => $status,
            ];

            // Lock & Seal / Board Outturn / Physical Dispatch share one
            // fixed_schedules column (local_outturn_to_dispatch_days) — count
            // it once, not once per stage that reads it.
            $column = self::SCHEDULE_COLUMN[$key];
            if ($days !== null && !isset($countedColumns[$column])) {
                $scheduledTotalDays += $days;
                $countedColumns[$column] = true;
            }

            if ($key === 'LOCAL_OUTTURN') {
                $dispatchAnchor = $actualDateOnly ?? $scheduled;
            }
            // Chain forward from this stage's actual date once we have it;
            // otherwise keep projecting off the schedule so every later
            // stage still gets a scheduled date, not just the next one.
            $prior = $actualDateOnly ?? $scheduled;
        }

        $shellActual = $actuals['SHELL_OUTTURN'] ?? null;
        $lastActual = null;
        foreach (array_reverse($actuals) as $v) {
            if ($v !== null) {
                $lastActual = $v;
                break;
            }
        }
        $actualTotalDays = null;
        if ($shellActual !== null) {
            $endDate = $lastActual !== null ? substr($lastActual, 0, 10) : $today;
            $actualTotalDays = (int) ((strtotime($endDate) - strtotime(substr($shellActual, 0, 10))) / 86400);
        }

        return [
            'stages' => $stages,
            'scheduled_total_days' => $scheduledTotalDays,
            'actual_total_days' => $actualTotalDays,
        ];
    }
}
