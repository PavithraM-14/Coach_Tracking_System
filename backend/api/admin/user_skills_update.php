<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';
require_once __DIR__ . '/../../lib/Operations.php';

$currentUser = Auth::requireRole(['ADMIN', 'ASSEMBLY_ADMIN']);

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

$stmt = $pdo->prepare('SELECT u.id, r.code AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = :id');
$stmt->execute(['id' => $userId]);
$targetUser = $stmt->fetch();
if (!$targetUser) {
    Response::error('User not found.', 404);
}

// Assembly Admin may only edit skills for its own Assembly Operation /
// Mechanical Inspection / Electrical Inspection workers, and only with
// skills matching that worker's own role — never someone else's
// Furnishing/Outturn-Dispatch skills, and never a skill from one of these
// three roles onto a worker of a different one.
$assemblyOpRoles = ['ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION'];
if ($currentUser['role'] === 'ASSEMBLY_ADMIN') {
    if (!in_array($targetUser['role'], $assemblyOpRoles, true)) {
        Response::error('Assembly Admin can only edit Assembly Operation / Mechanical Inspection / Electrical Inspection worker skills.', 403);
    }
    if ($skillIds) {
        $inClause = implode(',', array_map('intval', $skillIds));
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM skills WHERE role_code = :role_code AND id IN ($inClause)");
        $stmt->execute(['role_code' => $targetUser['role']]);
        $validCount = (int) $stmt->fetchColumn();
        if ($validCount !== count(array_unique($skillIds))) {
            Response::error('One or more skills do not match this worker\'s role.', 400);
        }
    }
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
        if (isset(Operations::MODULE_OPERATION[$module])) {
            Assignment::fillCapacityForUser($pdo, $userId, $module);
        }
    }
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to update skills: ' . $e->getMessage(), 500);
}

Response::ok(['user_id' => $userId, 'skill_ids' => $skillIds]);
