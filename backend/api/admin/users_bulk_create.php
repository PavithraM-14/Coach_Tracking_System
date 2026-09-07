<?php

require_once __DIR__ . '/../../bootstrap.php';

// Same three roles as the single-user create endpoint, and every row below
// is scoped by exactly the same rules as users_create.php -- this is just
// that endpoint's validation run once per spreadsheet row instead of once
// per form submit.
$currentUser = Auth::requireRole(['ADMIN', 'PAINT_ADMIN', 'ASSEMBLY_ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$rows = is_array($body['rows'] ?? null) ? $body['rows'] : [];

if (!$rows) {
    Response::error('No rows to import.', 400);
}

$pdo = Db::get();

$allRoles = $pdo->query('SELECT id, code, name FROM roles')->fetchAll();

// Bulk-created users all start with the same default password (shown in the
// upload UI) since a spreadsheet realistically can't carry a unique secure
// password per row -- they're expected to log in and use "Forgot password"
// or otherwise be told this value out of band.
$defaultPasswordHash = password_hash('Welcome@123', PASSWORD_BCRYPT);

$created = [];
$skipped = [];

foreach ($rows as $index => $row) {
    $employeeNo = trim((string) ($row['employee_no'] ?? ''));
    $fullName = trim((string) ($row['full_name'] ?? ''));
    $username = trim((string) ($row['username'] ?? ''));
    $email = trim((string) ($row['email'] ?? ''));
    $roleInput = trim((string) ($row['role'] ?? ''));
    $assignedVendor = strtoupper(trim((string) ($row['assigned_vendor'] ?? '')));

    // A fully blank row (common as trailing rows in a spreadsheet) is simply
    // ignored -- not counted as a skipped/invalid row.
    if ($employeeNo === '' && $fullName === '' && $username === '' && $roleInput === '') {
        continue;
    }

    if ($employeeNo === '' || $fullName === '' || $username === '' || $roleInput === '') {
        $skipped[] = ['row' => $index, 'reason' => 'employee_no, full_name, username and role are all required.'];
        continue;
    }
    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $skipped[] = ['row' => $index, 'reason' => 'Email address is not valid.'];
        continue;
    }
    if ($assignedVendor !== '' && !in_array($assignedVendor, ['ICF', 'A', 'B', 'C'], true)) {
        $skipped[] = ['row' => $index, 'reason' => 'assigned_vendor must be one of ICF, A, B, C.'];
        continue;
    }

    $matchedRole = null;
    foreach ($allRoles as $r) {
        if (strcasecmp($r['code'], $roleInput) === 0 || strcasecmp($r['name'], $roleInput) === 0) {
            $matchedRole = $r;
            break;
        }
    }
    if (!$matchedRole) {
        $skipped[] = ['row' => $index, 'reason' => "Role \"{$roleInput}\" does not match any role code or name."];
        continue;
    }
    $targetRoleCode = $matchedRole['code'];

    // Mirrors users_create.php exactly: Paint Admin / Assembly Admin may only
    // create logins for their own shop's workers; Admin creates every other
    // role but no longer these worker roles directly.
    if ($currentUser['role'] === 'PAINT_ADMIN') {
        if ($targetRoleCode !== 'PAINT') {
            $skipped[] = ['row' => $index, 'reason' => 'Paint Admin can only create Paint worker logins.'];
            continue;
        }
    } elseif ($currentUser['role'] === 'ASSEMBLY_ADMIN') {
        if (!in_array($targetRoleCode, ['ASSEMBLY_PRODUCTION', 'ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION'], true)) {
            $skipped[] = [
                'row' => $index,
                'reason' => 'Assembly Admin can only create Assembly worker, Assembly Operation, Mechanical Inspection or Electrical Inspection logins.',
            ];
            continue;
        }
    } elseif (in_array($targetRoleCode, ['PAINT', 'ASSEMBLY_PRODUCTION', 'ASSEMBLY_OPERATION', 'MECHANICAL_INSPECTION', 'ELECTRICAL_INSPECTION'], true)) {
        $skipped[] = [
            'row' => $index,
            'reason' => 'Admin cannot create this role directly -- use a Paint Admin or Assembly Admin login instead.',
        ];
        continue;
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
        $skipped[] = ['row' => $index, 'reason' => 'A user with this username, employee number or email already exists.'];
        continue;
    }

    // Two rows in the same file can't both be caught by the DB check above
    // until the first is actually inserted -- guard against that here.
    $duplicateInBatch = false;
    foreach ($created as $c) {
        if ($c['username'] === $username || $c['employee_no'] === $employeeNo) {
            $duplicateInBatch = true;
            break;
        }
    }
    if ($duplicateInBatch) {
        $skipped[] = ['row' => $index, 'reason' => 'Duplicate username or employee number elsewhere in this file.'];
        continue;
    }

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
            'password_hash' => $defaultPasswordHash,
            'role_id' => $matchedRole['id'],
            'assigned_vendor' => $assignedVendor !== '' ? $assignedVendor : null,
        ]);
        $created[] = ['row' => $index, 'username' => $username, 'employee_no' => $employeeNo];
    } catch (Throwable $e) {
        $skipped[] = ['row' => $index, 'reason' => 'Failed to create: ' . $e->getMessage()];
    }
}

Response::ok([
    'created_count' => count($created),
    'skipped_count' => count($skipped),
    'created' => $created,
    'skipped' => $skipped,
]);
