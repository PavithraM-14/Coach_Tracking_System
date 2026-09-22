<?php

// Audit trail for Block/Unblock actions on Paint/Assembly lines and slots —
// see line_block_log in schema.sql for why this exists (the is_active flag
// itself carries no history).
class BlockLog
{
    public static function record(PDO $pdo, string $pool, string $targetLabel, bool $isActive, int $userId): void
    {
        $pdo->prepare(
            'INSERT INTO line_block_log (pool, target_label, action, performed_by_user_id)
             VALUES (:pool, :target_label, :action, :performed_by_user_id)'
        )->execute([
            'pool' => $pool,
            'target_label' => $targetLabel,
            'action' => $isActive ? 'UNBLOCK' : 'BLOCK',
            'performed_by_user_id' => $userId,
        ]);
    }
}
