<?php

require_once __DIR__ . '/Operations.php';

// Coach assignment engine for every "who does the next action on this
// coach" module in the pipeline: FURNISHING (Furnishing In), PAINT (Paint
// In), PAINT_OUT (Paint Out), ASSEMBLY_IN (Assembly In), ASSEMBLY_OUT
// (Assembly Out).
//
// Two matching strategies coexist:
// - SKILL_MODULES matches on `skills`/`user_skills` at coach CATEGORY
//   granularity (LHB AC / LHB Non-AC), keyed by OPERATION (Operations::
//   MODULE_OPERATION) and a role_code lookup (a module name doesn't always
//   equal its role_code — ASSEMBLY_IN and ASSEMBLY_OUT are both performed by
//   role ASSEMBLY_PRODUCTION).
// - MATRIX_MODULES matches on `paint_type_assignments` at coach TYPE
//   granularity (finer — e.g. LWCBAC, not just "LHB AC"), configured via the
//   Admin "Paint Assignments" matrix, with independent can_in/can_out flags
//   per (Paint employee, coach type) cell. Covers PAINT (can_in) and
//   PAINT_OUT (can_out) — both roles are PAINT, only the flag differs.
//
// Capacity is per-module: Furnishing In is done by a single employee in
// practice, so it has NO cap. Every other module caps at 5 concurrent
// ASSIGNED coaches per employee (parallel workers across lines) — beyond
// that, a coach sits QUEUED.
class Assignment
{
    const MODULE_CAPACITY = [
        'FURNISHING' => null, // unlimited
        'PAINT' => 5,
        'PAINT_OUT' => 5,
        'ASSEMBLY_IN' => 5,
        'ASSEMBLY_OUT' => 5,
    ];

    /** module => role_code, for skills/user_skills-matched modules. */
    const SKILL_MODULES = [
        'FURNISHING' => 'FURNISHING',
        'ASSEMBLY_IN' => 'ASSEMBLY_PRODUCTION',
        'ASSEMBLY_OUT' => 'ASSEMBLY_PRODUCTION',
    ];

    /** module => paint_type_assignments flag column, for matrix-matched modules. */
    const MATRIX_MODULES = [
        'PAINT' => 'can_in',
        'PAINT_OUT' => 'can_out',
    ];

    /** Null means unlimited. */
    public static function capacityFor(string $module): ?int
    {
        return self::MODULE_CAPACITY[$module] ?? null;
    }

    /**
     * Which modules this specific user is actually configured to work —
     * i.e. has a matching skill (skill-based modules) or a matrix cell with
     * the right flag set (matrix-based modules), for at least one coach
     * category/type. Separate employees can be configured for only one side
     * of an In/Out pair (e.g. paint1 = Paint In only, paint2 = Paint Out
     * only) — this is what the frontend uses to show/hide nav links and
     * gate entry pages per employee, on top of the coarser role check.
     */
    public static function userCapableModules(PDO $pdo, int $userId, string $roleCode): array
    {
        $capable = [];

        foreach (self::SKILL_MODULES as $module => $moduleRole) {
            if ($moduleRole !== $roleCode) {
                continue;
            }
            $operation = Operations::MODULE_OPERATION[$module];
            $stmt = $pdo->prepare(
                'SELECT 1 FROM user_skills us JOIN skills s ON s.id = us.skill_id
                 WHERE us.user_id = :user_id AND s.operation = :operation LIMIT 1'
            );
            $stmt->execute(['user_id' => $userId, 'operation' => $operation]);
            if ($stmt->fetch()) {
                $capable[] = $module;
            }
        }

        if ($roleCode === 'PAINT') {
            foreach (self::MATRIX_MODULES as $module => $flagColumn) {
                $flagColumn = $flagColumn === 'can_out' ? 'can_out' : 'can_in'; // whitelist
                $stmt = $pdo->prepare(
                    "SELECT 1 FROM paint_type_assignments WHERE user_id = :user_id AND $flagColumn = 1 LIMIT 1"
                );
                $stmt->execute(['user_id' => $userId]);
                if ($stmt->fetch()) {
                    $capable[] = $module;
                }
            }
        }

        return $capable;
    }

    /**
     * Called when a coach becomes eligible for a module (Shell Outturn
     * recorded, or the previous stage's record created). Assigns it to the
     * least-loaded eligible employee with capacity, or leaves it QUEUED if
     * none have room (never happens for an unlimited-capacity module, as
     * long as at least one active employee is eligible).
     */
    public static function assignOrQueue(PDO $pdo, int $coachId, string $module): void
    {
        $capacity = self::capacityFor($module);
        $candidate = isset(self::MATRIX_MODULES[$module])
            ? self::leastLoadedMatrixCandidate($pdo, $coachId, $module, self::MATRIX_MODULES[$module], $capacity)
            : self::leastLoadedSkillCandidate($pdo, $coachId, $module, $capacity);

        $insert = $pdo->prepare(
            'INSERT INTO coach_assignments (coach_id, module, assigned_user_id, status, assigned_at)
             VALUES (:coach_id, :module, :assigned_user_id, :status, :assigned_at)'
        );

        if ($candidate) {
            $insert->execute([
                'coach_id' => $coachId,
                'module' => $module,
                'assigned_user_id' => $candidate,
                'status' => 'ASSIGNED',
                'assigned_at' => date('Y-m-d H:i:s'),
            ]);
        } else {
            $insert->execute([
                'coach_id' => $coachId,
                'module' => $module,
                'assigned_user_id' => null,
                'status' => 'QUEUED',
                'assigned_at' => null,
            ]);
        }
    }

    private static function leastLoadedSkillCandidate(PDO $pdo, int $coachId, string $module, ?int $capacity): ?int
    {
        $coachCategoryId = self::coachCategoryId($pdo, $coachId);
        $operation = Operations::MODULE_OPERATION[$module];
        $roleCode = self::SKILL_MODULES[$module];

        $params = [
            'module_sub' => $module,
            'role_code' => $roleCode,
            'operation' => $operation,
            'coach_category_id' => $coachCategoryId,
        ];
        $havingClause = '';
        if ($capacity !== null) {
            $havingClause = 'HAVING load_count < :max_concurrent';
            $params['max_concurrent'] = $capacity;
        }

        $stmt = $pdo->prepare(
            "SELECT u.id,
                    (SELECT COUNT(*) FROM coach_assignments ca
                     WHERE ca.assigned_user_id = u.id AND ca.module = :module_sub AND ca.status = 'ASSIGNED') AS load_count
             FROM users u
             JOIN roles r ON r.id = u.role_id
             JOIN user_skills us ON us.user_id = u.id
             JOIN skills s ON s.id = us.skill_id
             WHERE r.code = :role_code AND u.is_active = 1
               AND s.operation = :operation AND s.coach_category_id = :coach_category_id
             GROUP BY u.id
             $havingClause
             ORDER BY load_count ASC, u.id ASC
             LIMIT 1"
        );
        $stmt->execute($params);
        $candidate = $stmt->fetch();
        return $candidate ? (int) $candidate['id'] : null;
    }

    /** $flagColumn is 'can_in' or 'can_out' — which paint_type_assignments column must be 1. */
    private static function leastLoadedMatrixCandidate(PDO $pdo, int $coachId, string $module, string $flagColumn, ?int $capacity): ?int
    {
        $coachTypeId = self::coachTypeId($pdo, $coachId);
        $flagColumn = $flagColumn === 'can_out' ? 'can_out' : 'can_in'; // whitelist, never interpolate raw input

        $params = [
            'module_sub' => $module,
            'coach_type_id' => $coachTypeId,
        ];
        $havingClause = '';
        if ($capacity !== null) {
            $havingClause = 'HAVING load_count < :max_concurrent';
            $params['max_concurrent'] = $capacity;
        }

        $stmt = $pdo->prepare(
            "SELECT u.id,
                    (SELECT COUNT(*) FROM coach_assignments ca
                     WHERE ca.assigned_user_id = u.id AND ca.module = :module_sub AND ca.status = 'ASSIGNED') AS load_count
             FROM users u
             JOIN roles r ON r.id = u.role_id
             JOIN paint_type_assignments pta ON pta.user_id = u.id
             WHERE r.code = 'PAINT' AND u.is_active = 1
               AND pta.coach_type_id = :coach_type_id AND pta.$flagColumn = 1
             GROUP BY u.id
             $havingClause
             ORDER BY load_count ASC, u.id ASC
             LIMIT 1"
        );
        $stmt->execute($params);
        $candidate = $stmt->fetch();
        return $candidate ? (int) $candidate['id'] : null;
    }

    /**
     * Called when the employee performs the action (Furnishing In / Paint In
     * / Paint Out / Assembly In / Assembly Out created) for a coach. Marks
     * their assignment COMPLETED, then pulls the next matching QUEUED coach
     * (if any) into their now-freed capacity.
     */
    public static function complete(PDO $pdo, int $coachId, string $module): void
    {
        $stmt = $pdo->prepare(
            "SELECT id, assigned_user_id FROM coach_assignments
             WHERE coach_id = :coach_id AND module = :module"
        );
        $stmt->execute(['coach_id' => $coachId, 'module' => $module]);
        $assignment = $stmt->fetch();
        if (!$assignment) {
            return; // no assignment row (shouldn't normally happen) — nothing to complete
        }

        $update = $pdo->prepare(
            "UPDATE coach_assignments SET status = 'COMPLETED', completed_at = :completed_at WHERE id = :id"
        );
        $update->execute(['completed_at' => date('Y-m-d H:i:s'), 'id' => $assignment['id']]);

        if ($assignment['assigned_user_id']) {
            self::fillCapacityForUser($pdo, (int) $assignment['assigned_user_id'], $module);
        }
    }

    /**
     * While the user has spare capacity for this module, pull the oldest
     * QUEUED coach matching their eligibility and assign it to them. A no-op
     * for an unlimited-capacity module — nothing is ever QUEUED there, so
     * there's nothing to pull.
     */
    public static function fillCapacityForUser(PDO $pdo, int $userId, string $module): void
    {
        $capacity = self::capacityFor($module);
        if ($capacity === null) {
            return;
        }

        while (true) {
            $loadStmt = $pdo->prepare(
                "SELECT COUNT(*) FROM coach_assignments WHERE assigned_user_id = :user_id AND module = :module AND status = 'ASSIGNED'"
            );
            $loadStmt->execute(['user_id' => $userId, 'module' => $module]);
            if ((int) $loadStmt->fetchColumn() >= $capacity) {
                return;
            }

            $nextId = isset(self::MATRIX_MODULES[$module])
                ? self::nextQueuedMatrixAssignment($pdo, $userId, $module, self::MATRIX_MODULES[$module])
                : self::nextQueuedSkillAssignment($pdo, $userId, $module);
            if (!$nextId) {
                return;
            }

            $assign = $pdo->prepare(
                "UPDATE coach_assignments SET status = 'ASSIGNED', assigned_user_id = :user_id, assigned_at = :assigned_at WHERE id = :id"
            );
            $assign->execute(['user_id' => $userId, 'assigned_at' => date('Y-m-d H:i:s'), 'id' => $nextId]);
        }
    }

    private static function nextQueuedSkillAssignment(PDO $pdo, int $userId, string $module): ?int
    {
        $operation = Operations::MODULE_OPERATION[$module];
        $stmt = $pdo->prepare(
            "SELECT ca.id
             FROM coach_assignments ca
             JOIN coaches c ON c.id = ca.coach_id
             JOIN coach_types ct ON ct.id = c.coach_type_id
             JOIN user_skills us ON us.user_id = :user_id
             JOIN skills s ON s.id = us.skill_id AND s.operation = :operation AND s.coach_category_id = ct.category_id
             WHERE ca.module = :module2 AND ca.status = 'QUEUED'
             ORDER BY ca.created_at ASC
             LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId, 'operation' => $operation, 'module2' => $module]);
        $row = $stmt->fetch();
        return $row ? (int) $row['id'] : null;
    }

    private static function nextQueuedMatrixAssignment(PDO $pdo, int $userId, string $module, string $flagColumn): ?int
    {
        $flagColumn = $flagColumn === 'can_out' ? 'can_out' : 'can_in'; // whitelist, never interpolate raw input
        $stmt = $pdo->prepare(
            "SELECT ca.id
             FROM coach_assignments ca
             JOIN coaches c ON c.id = ca.coach_id
             JOIN paint_type_assignments pta ON pta.user_id = :user_id AND pta.coach_type_id = c.coach_type_id AND pta.$flagColumn = 1
             WHERE ca.module = :module2 AND ca.status = 'QUEUED'
             ORDER BY ca.created_at ASC
             LIMIT 1"
        );
        $stmt->execute(['user_id' => $userId, 'module2' => $module]);
        $row = $stmt->fetch();
        return $row ? (int) $row['id'] : null;
    }

    private static function coachCategoryId(PDO $pdo, int $coachId): int
    {
        $stmt = $pdo->prepare(
            'SELECT ct.category_id FROM coaches c JOIN coach_types ct ON ct.id = c.coach_type_id WHERE c.id = :coach_id'
        );
        $stmt->execute(['coach_id' => $coachId]);
        return (int) $stmt->fetchColumn();
    }

    private static function coachTypeId(PDO $pdo, int $coachId): int
    {
        $stmt = $pdo->prepare('SELECT coach_type_id FROM coaches WHERE id = :coach_id');
        $stmt->execute(['coach_id' => $coachId]);
        return (int) $stmt->fetchColumn();
    }
}
