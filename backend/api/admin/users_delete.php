<?php

require_once __DIR__ . '/../../bootstrap.php';

$currentUser = Auth::requireRole(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$userId = (int) ($body['user_id'] ?? 0);

if ($userId <= 0) {
    Response::error('user_id is required.', 400);
}
if ($userId === (int) $currentUser['sub']) {
    Response::error('You cannot delete your own account.', 400);
}

$pdo = Db::get();
$stmt = $pdo->prepare('SELECT id, username FROM users WHERE id = :id');
$stmt->execute(['id' => $userId]);
$user = $stmt->fetch();
if (!$user) {
    Response::error('User not found.', 404);
}

// A user who has recorded any transaction is never hard-deleted — that would
// either violate the FK (recorded_by_user_id) or silently erase who did the
// work. Deactivate instead so the audit trail (and this account's history)
// stays intact; only a user with zero history is actually removed.
$referenceChecks = [
    'shell_outturn_transactions' => 'recorded_by_user_id',
    'furnishing_in_records' => 'recorded_by_user_id',
    'paint_in_transactions' => 'recorded_by_user_id',
    'paint_out_transactions' => 'recorded_by_user_id',
    'assembly_in_transactions' => 'recorded_by_user_id',
    'assembly_out_transactions' => 'recorded_by_user_id',
    'local_outturn_records' => 'recorded_by_user_id',
    'lock_seal_records' => 'recorded_by_user_id',
    'board_outturn_records' => 'recorded_by_user_id',
    'physical_dispatch_records' => 'recorded_by_user_id',
    'coach_assignments' => 'assigned_user_id',
];
$hasHistory = false;
foreach ($referenceChecks as $table => $column) {
    $check = $pdo->prepare("SELECT 1 FROM `$table` WHERE `$column` = :user_id LIMIT 1");
    $check->execute(['user_id' => $userId]);
    if ($check->fetch()) {
        $hasHistory = true;
        break;
    }
}

if ($hasHistory) {
    $pdo->prepare('UPDATE users SET is_active = 0 WHERE id = :id')->execute(['id' => $userId]);
    Response::ok([
        'deleted' => false,
        'deactivated' => true,
        'message' => "User \"{$user['username']}\" has recorded transactions and was deactivated (not deleted) to preserve audit history.",
    ]);
}

$pdo->beginTransaction();
try {
    $pdo->prepare('DELETE FROM user_skills WHERE user_id = :id')->execute(['id' => $userId]);
    // Matrix config, not audit history — safe to clear on a user with zero
    // recorded work (the referenceChecks above already ruled out real history).
    $pdo->prepare('DELETE FROM paint_type_assignments WHERE user_id = :id')->execute(['id' => $userId]);
    $pdo->prepare('DELETE FROM users WHERE id = :id')->execute(['id' => $userId]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to delete user: ' . $e->getMessage(), 500);
}

Response::ok([
    'deleted' => true,
    'deactivated' => false,
    'message' => "User \"{$user['username']}\" deleted.",
]);
