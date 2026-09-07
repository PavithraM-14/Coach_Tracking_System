<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed.', 405);
}

$body = requestBody();
$categoryId = (int) ($body['category_id'] ?? 0);
$name = trim((string) ($body['name'] ?? ''));

if ($categoryId <= 0 || $name === '') {
    Response::error('category_id and name are required.', 400);
}

$pdo = Db::get();

$stmt = $pdo->prepare('SELECT id FROM coach_categories WHERE id = :id');
$stmt->execute(['id' => $categoryId]);
if (!$stmt->fetch()) {
    Response::error('Coach category not found.', 404);
}

$pdo->prepare('UPDATE coach_categories SET name = :name WHERE id = :id')
    ->execute(['name' => $name, 'id' => $categoryId]);

Response::ok(['category_id' => $categoryId, 'name' => $name]);
