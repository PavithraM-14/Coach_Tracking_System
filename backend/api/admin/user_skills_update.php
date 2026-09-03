<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

Auth::requireRole(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$userId = (int) ($body['user_id'] ?? 0);
$skillIds = array_map('intval', $body['skill_ids'] ?? []);

if ($userId <= 0) {
    Response::error('user_id is required.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM users WHERE id = :id');
$stmt->execute(['id' => $userId]);
if (!$stmt->fetch()) {
    Response::error('User not found.', 404);
}

$pdo->beginTransaction();
try {
    $pdo->prepare('DELETE FROM user_skills WHERE user_id = :user_id')->execute(['user_id' => $userId]);

    $affectedModules = [];
    if ($skillIds) {
        $skillStmt = $pdo->prepare('SELECT id, role_code FROM skills WHERE id = :id');
        $insertStmt = $pdo->prepare('INSERT IGNORE INTO user_skills (user_id, skill_id) VALUES (:user_id, :skill_id)');
        foreach ($skillIds as $skillId) {
            $skillStmt->execute(['id' => $skillId]);
            $skill = $skillStmt->fetch();
            if (!$skill) {
                continue;
            }
            $insertStmt->execute(['user_id' => $userId, 'skill_id' => $skillId]);
            $affectedModules[$skill['role_code']] = true;
        }
    }

    $pdo->commit();

    foreach (array_keys($affectedModules) as $module) {
        Assignment::fillCapacityForUser($pdo, $userId, $module);
    }
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to update skills: ' . $e->getMessage(), 500);
}

Response::ok(['user_id' => $userId, 'skill_ids' => $skillIds]);
