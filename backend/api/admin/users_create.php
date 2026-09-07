<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';
require_once __DIR__ . '/../../lib/Operations.php';

$currentUser = Auth::requireRole(['ADMIN', 'PAINT_ADMIN', 'ASSEMBLY_ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$employeeNo = trim($body['employee_no'] ?? '');
$fullName = trim($body['full_name'] ?? '');
$username = trim($body['username'] ?? '');
$email = trim((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');
$roleId = (int) ($body['role_id'] ?? 0);
$skillIds = array_map('intval', $body['skill_ids'] ?? []);
$assignedVendor = trim($body['assigned_vendor'] ?? '');

if ($employeeNo === '' || $fullName === '' || $username === '' || $password === '' || $roleId <= 0) {
    Response::error('employee_no, full_name, username, password and role_id are all required.', 400);
}
if (strlen($password) < 6) {
    Response::error('Password must be at least 6 characters.', 400);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Response::error('Email address is not valid.', 400);
}
if ($assignedVendor !== '' && !in_array($assignedVendor, ['ICF', 'A', 'B', 'C'], true)) {
    Response::error('assigned_vendor must be one of ICF, A, B, C.', 400);
}

$pdo = Db::get();

$roleCodeStmt = $pdo->prepare('SELECT code FROM roles WHERE id = :id');
$roleCodeStmt->execute(['id' => $roleId]);
$targetRoleCode = $roleCodeStmt->fetchColumn();
if ($targetRoleCode === false) {
    Response::error('Selected role does not exist.', 400);
}

// Paint Admin / Assembly Admin may only create logins for their own shop's
// workers. Admin creates every other role (including Paint Admin/Assembly
// Admin themselves) but no longer PAINT/ASSEMBLY_PRODUCTION directly — that
// now belongs to their respective scoped admin.
if ($currentUser['role'] === 'PAINT_ADMIN') {
    if ($targetRoleCode !== 'PAINT') {
        Response::error('Paint Admin can only create Paint worker logins.', 403);
    }
} elseif ($currentUser['role'] === 'ASSEMBLY_ADMIN') {
    if (!in_array($targetRoleCode, ['ASSEMBLY_PRODUCTION', 'ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION'], true)) {
        Response::error('Assembly Admin can only create Assembly worker, Assembly Operation, Mechanical Inspection or Electrical Inspection logins.', 403);
    }
} elseif (in_array($targetRoleCode, ['PAINT', 'ASSEMBLY_PRODUCTION', 'ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION'], true)) {
    Response::error(
        'Admin no longer creates Paint/Assembly worker logins directly — create a Paint Admin or Assembly Admin login instead, who can then add workers.',
        403
    );
}

$dupConditions = ['username = :username', 'employee_no = :employee_no'];
$dupParams = ['username' => $username, 'employee_no' => $employeeNo];
if ($email !== '') {
    $dupConditions[] = 'email = :email';
    $dupParams['email'] = $email;
}
$stmt = $pdo->prepare('SELECT id FROM users WHERE ' . implode(' OR ', $dupConditions));
$stmt->execute($dupParams);
if ($stmt->fetch()) {
    Response::error('A user with this username, employee number or email already exists.', 409);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare(
        'INSERT INTO users (employee_no, full_name, username, email, password_hash, role_id, assigned_vendor)
         VALUES (:employee_no, :full_name, :username, :email, :password_hash, :role_id, :assigned_vendor)'
    );
    $stmt->execute([
        'employee_no' => $employeeNo,
        'full_name' => $fullName,
        'username' => $username,
        'email' => $email !== '' ? $email : null,
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'role_id' => $roleId,
        'assigned_vendor' => $assignedVendor !== '' ? $assignedVendor : null,
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
    // Only modules with a live assignment queue (see Operations::MODULE_OPERATION)
    // have anything to fill — e.g. ASSEMBLY_PRODUCTION skills can exist ahead of
    // that module being built, with nothing to assign yet.
    foreach (array_keys($affectedModules) as $module) {
        if (isset(Operations::MODULE_OPERATION[$module])) {
            Assignment::fillCapacityForUser($pdo, $userId, $module);
        }
    }
} catch (Throwable $e) {
    $pdo->rollBack();
    Response::error('Failed to create user: ' . $e->getMessage(), 500);
}

Response::ok(['id' => $userId], 201);
