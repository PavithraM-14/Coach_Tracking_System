<?php

// Skill-based coach assignment engine for the FURNISHING and PAINT modules.
// A "module" here means "who is responsible for the next action on this
// coach": FURNISHING = who should record Furnishing Out; PAINT = who should
// record Paint In. Max 5 concurrently ASSIGNED coaches per employee; beyond
// that a coach sits QUEUED until the employee completes one of theirs.
class Assignment
{
    const MAX_CONCURRENT = 5;

    /**
     * Called when a coach becomes eligible for a module (Furnishing In created,
     * or Furnishing Out created). Assigns it to the least-loaded eligible
     * employee with capacity, or leaves it QUEUED if none have room.
     */
    public static function assignOrQueue(PDO $pdo, int $coachId, string $module): void
    {
        $coachCategoryId = self::coachCategoryId($pdo, $coachId);

        $stmt = $pdo->prepare(
            "SELECT u.id,
                    (SELECT COUNT(*) FROM coach_assignments ca
                     WHERE ca.assigned_user_id = u.id AND ca.module = :module_sub AND ca.status = 'ASSIGNED') AS load_count
             FROM users u
             JOIN roles r ON r.id = u.role_id
             JOIN user_skills us ON us.user_id = u.id
             JOIN skills s ON s.id = us.skill_id
             WHERE r.code = :role_code AND u.is_active = 1
               AND s.role_code = :module_where AND s.coach_category_id = :coach_category_id
             GROUP BY u.id
             HAVING load_count < :max_concurrent
             ORDER BY load_count ASC, u.id ASC
             LIMIT 1"
        );
        $stmt->execute([
            'module_sub' => $module,
            'role_code' => $module,
            'module_where' => $module,
            'coach_category_id' => $coachCategoryId,
            'max_concurrent' => self::MAX_CONCURRENT,
        ]);
        $candidate = $stmt->fetch();

        $insert = $pdo->prepare(
            'INSERT INTO coach_assignments (coach_id, module, assigned_user_id, status, assigned_at)
             VALUES (:coach_id, :module, :assigned_user_id, :status, :assigned_at)'
        );

        if ($candidate) {
            $insert->execute([
                'coach_id' => $coachId,
                'module' => $module,
                'assigned_user_id' => $candidate['id'],
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

    /**
     * Called when the employee performs the action (Furnishing Out / Paint In
     * created) for a coach. Marks their assignment COMPLETED, then pulls the
     * next matching QUEUED coach (if any) into their now-freed capacity.
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
     * QUEUED coach matching one of their skills and assign it to them.
     */
    public static function fillCapacityForUser(PDO $pdo, int $userId, string $module): void
    {
        while (true) {
            $loadStmt = $pdo->prepare(
                "SELECT COUNT(*) FROM coach_assignments WHERE assigned_user_id = :user_id AND module = :module AND status = 'ASSIGNED'"
            );
            $loadStmt->execute(['user_id' => $userId, 'module' => $module]);
            if ((int) $loadStmt->fetchColumn() >= self::MAX_CONCURRENT) {
                return;
            }

            $nextStmt = $pdo->prepare(
                "SELECT ca.id
                 FROM coach_assignments ca
                 JOIN coaches c ON c.id = ca.coach_id
                 JOIN coach_types ct ON ct.id = c.coach_type_id
                 JOIN user_skills us ON us.user_id = :user_id
                 JOIN skills s ON s.id = us.skill_id AND s.role_code = :module AND s.coach_category_id = ct.category_id
                 WHERE ca.module = :module2 AND ca.status = 'QUEUED'
                 ORDER BY ca.created_at ASC
                 LIMIT 1"
            );
            $nextStmt->execute(['user_id' => $userId, 'module' => $module, 'module2' => $module]);
            $next = $nextStmt->fetch();
            if (!$next) {
                return;
            }

            $assign = $pdo->prepare(
                "UPDATE coach_assignments SET status = 'ASSIGNED', assigned_user_id = :user_id, assigned_at = :assigned_at WHERE id = :id"
            );
            $assign->execute(['user_id' => $userId, 'assigned_at' => date('Y-m-d H:i:s'), 'id' => $next['id']]);
        }
    }

    private static function coachCategoryId(PDO $pdo, int $coachId): int
    {
        $stmt = $pdo->prepare(
            'SELECT ct.category_id FROM coaches c JOIN coach_types ct ON ct.id = c.coach_type_id WHERE c.id = :coach_id'
        );
        $stmt->execute(['coach_id' => $coachId]);
        return (int) $stmt->fetchColumn();
    }
}
