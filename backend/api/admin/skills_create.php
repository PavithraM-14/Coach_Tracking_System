<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Operations.php';

Auth::requireRole(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$name = trim($body['name'] ?? '');
$operation = trim($body['operation'] ?? '');
$coachCategoryId = (int) ($body['coach_category_id'] ?? 0);

if ($name === '' || $coachCategoryId <= 0) {
    Response::error('name and coach_category_id are required.', 400);
}
if (!Operations::isValid($operation)) {
    Response::error('operation must be one of: ' . implode(', ', array_keys(Operations::MAP)), 400);
}
$roleCode = Operations::roleFor($operation);

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM coach_categories WHERE id = :id');
$stmt->execute(['id' => $coachCategoryId]);
if (!$stmt->fetch()) {
    Response::error('Coach category not found.', 404);
}

try {
    $stmt = $pdo->prepare(
        'INSERT INTO skills (name, operation, role_code, coach_category_id)
         VALUES (:name, :operation, :role_code, :coach_category_id)'
    );
    $stmt->execute([
        'name' => $name,
        'operation' => $operation,
        'role_code' => $roleCode,
        'coach_category_id' => $coachCategoryId,
    ]);
} catch (PDOException $e) {
    if ($e->errorInfo[1] === 1062) {
        Response::error('This exact skill (name + operation + category) already exists.', 409);
    }
    Response::error('Failed to create skill: ' . $e->getMessage(), 500);
}

Response::ok(['id' => (int) $pdo->lastInsertId()], 201);
