<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

Auth::requireRole(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$employeeNo = trim($body['employee_no'] ?? '');
$fullName = trim($body['full_name'] ?? '');
$username = trim($body['username'] ?? '');
$password = (string) ($body['password'] ?? '');
$roleId = (int) ($body['role_id'] ?? 0);
$skillIds = array_map('intval', $body['skill_ids'] ?? []);

if ($employeeNo === '' || $fullName === '' || $username === '' || $password === '' || $roleId <= 0) {
    Response::error('employee_no, full_name, username, password and role_id are all required.', 400);
}
if (strlen($password) < 6) {
    Response::error('Password must be at least 6 characters.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM users WHERE username = :username OR employee_no = :employee_no');
$stmt->execute(['username' => $username, 'employee_no' => $employeeNo]);
if ($stmt->fetch()) {
    Response::error('A user with this username or employee number already exists.', 409);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO users (employee_no, full_name, username, password_hash, role_id)
         VALUES (:employee_no, :full_name, :username, :password_hash, :role_id)'
    );
    $stmt->execute([
        'employee_no' => $employeeNo,
        'full_name' => $fullName,
        'username' => $username,
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'role_id' => $roleId,
    ]);
    $userId = (int) $pdo->lastInsertId();

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

    // A newly skilled employee may be able to pick up work sitting in the queue.
    foreach (array_keys($affectedModules) as $module) {
        Assignment::fillCapacityForUser($pdo, $userId, $module);
    }
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to create user: ' . $e->getMessage(), 500);
}

Response::ok(['id' => $userId], 201);
