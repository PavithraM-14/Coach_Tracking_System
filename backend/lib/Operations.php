<?php

// The fixed list of operations a skill can cover. FURNISHING_IN, ASSEMBLY_IN
// and ASSEMBLY_OUT are "live" (backed by a real assignment module in
// coach_assignments / Assignment.php). Paint does NOT use this table for
// either direction — it has its own, finer-grained (coach TYPE, not
// category) `paint_type_assignments` matrix instead, with independent
// In/Out flags per cell (see Assignment.php). Furnishing In is a manual,
// skill-gated step: Shell Outturn only queues the coach for a Furnishing
// employee, whose own submission (date pre-filled from Shell Outturn, but
// editable) is what actually opens the Furnishing In record and makes the
// coach Paint-In-eligible.
class Operations
{
    const MAP = [
        'FURNISHING_IN' => ['role' => 'FURNISHING', 'label' => 'Furnishing In', 'live' => true],
        'ASSEMBLY_IN' => ['role' => 'ASSEMBLY_PRODUCTION', 'label' => 'Assembly In', 'live' => true],
        'ASSEMBLY_OUT' => ['role' => 'ASSEMBLY_PRODUCTION', 'label' => 'Assembly Out', 'live' => true],
        'LOCAL_OUTTURN' => ['role' => 'OUTTURN_DISPATCH', 'label' => 'Local Outturn', 'live' => true],
        'LOCK_SEAL' => ['role' => 'OUTTURN_DISPATCH', 'label' => 'Lock & Seal', 'live' => true],
        'BOARD_OUTTURN' => ['role' => 'OUTTURN_DISPATCH', 'label' => 'Railway Board Outturn', 'live' => true],
        'PHYSICAL_DISPATCH' => ['role' => 'OUTTURN_DISPATCH', 'label' => 'Physical Dispatch', 'live' => true],
    ];

    // Which operation the assignment engine's "module" (coach_assignments.module)
    // actually assigns work for right now, for the skills/user_skills-based
    // modules (Paint/Paint Out use the separate paint_type_assignments matrix
    // instead — see Assignment::MATRIX_MODULES).
    const MODULE_OPERATION = [
        'FURNISHING' => 'FURNISHING_IN',
        'ASSEMBLY_IN' => 'ASSEMBLY_IN',
        'ASSEMBLY_OUT' => 'ASSEMBLY_OUT',
        'LOCAL_OUTTURN' => 'LOCAL_OUTTURN',
        'LOCK_SEAL' => 'LOCK_SEAL',
        'BOARD_OUTTURN' => 'BOARD_OUTTURN',
        'PHYSICAL_DISPATCH' => 'PHYSICAL_DISPATCH',
    ];

    public static function roleFor(string $operation): ?string
    {
        return self::MAP[$operation]['role'] ?? null;
    }

    public static function isValid(string $operation): bool
    {
        return isset(self::MAP[$operation]);
    }
}
