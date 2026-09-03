<?php

// The fixed list of operations a skill can cover. Only FURNISHING_OUT and
// PAINT_IN are "live" (backed by a real assignment module in
// coach_assignments / Assignment.php) — PAINT_OUT and ASSEMBLY_OP can be
// created ahead of those modules being built so Admin can start defining
// skills for them now, but nothing assigns work against them yet.
class Operations
{
    const MAP = [
        'FURNISHING_OUT' => ['role' => 'FURNISHING', 'label' => 'Furnishing Out', 'live' => true],
        'PAINT_IN' => ['role' => 'PAINT', 'label' => 'Paint In', 'live' => true],
        'PAINT_OUT' => ['role' => 'PAINT', 'label' => 'Paint Out', 'live' => false],
        'ASSEMBLY_OP' => ['role' => 'ASSEMBLY_PRODUCTION', 'label' => 'Assembly Operation', 'live' => false],
    ];

    // Which operation the assignment engine's "module" (coach_assignments.module,
    // also FURNISHING/PAINT) actually assigns work for right now.
    const MODULE_OPERATION = [
        'FURNISHING' => 'FURNISHING_OUT',
        'PAINT' => 'PAINT_IN',
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
