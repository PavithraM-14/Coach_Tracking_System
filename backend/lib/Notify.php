<?php

// Thin wrapper around inserting into `notifications` — called from the two
// shared Assignment.php methods that actually hand a coach to a specific
// user (covers all 9 stages uniformly) and from physical-dispatch/create.php
// (the pipeline's last stage).
class Notify
{
    const MODULE_LABELS = [
        'FURNISHING' => 'Furnishing In',
        'PAINT' => 'Paint In',
        'PAINT_OUT' => 'Paint Out',
        'ASSEMBLY_IN' => 'Assembly In',
        'ASSEMBLY_OUT' => 'Assembly Out',
        'LOCAL_OUTTURN' => 'Local Outturn',
        'LOCK_SEAL' => 'Lock & Seal',
        'BOARD_OUTTURN' => 'Railway Board Outturn',
        'PHYSICAL_DISPATCH' => 'Physical Dispatch',
    ];

    public static function coachAssigned(PDO $pdo, int $userId, int $coachId, string $module): void
    {
        $stmt = $pdo->prepare('SELECT coach_number FROM coaches WHERE id = :id');
        $stmt->execute(['id' => $coachId]);
        $coachNumber = $stmt->fetchColumn();
        if ($coachNumber === false) {
            return;
        }

        $label = self::MODULE_LABELS[$module] ?? $module;
        $pdo->prepare(
            'INSERT INTO notifications (user_id, type, coach_id, message)
             VALUES (:user_id, :type, :coach_id, :message)'
        )->execute([
            'user_id' => $userId,
            'type' => 'COACH_ASSIGNED',
            'coach_id' => $coachId,
            'message' => "Coach {$coachNumber} assigned to you for {$label}.",
        ]);
    }

    public static function coachCompleted(PDO $pdo, int $coachId): void
    {
        $stmt = $pdo->prepare('SELECT coach_number FROM coaches WHERE id = :id');
        $stmt->execute(['id' => $coachId]);
        $coachNumber = $stmt->fetchColumn();
        if ($coachNumber === false) {
            return;
        }

        $admins = $pdo->query(
            "SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.code = 'ADMIN' AND u.is_active = 1"
        )->fetchAll();

        $insert = $pdo->prepare(
            'INSERT INTO notifications (user_id, type, coach_id, message)
             VALUES (:user_id, :type, :coach_id, :message)'
        );
        foreach ($admins as $admin) {
            $insert->execute([
                'user_id' => (int) $admin['id'],
                'type' => 'COACH_COMPLETED',
                'coach_id' => $coachId,
                'message' => "Coach {$coachNumber} has completed the full pipeline (Physical Dispatch).",
            ]);
        }
    }
}
