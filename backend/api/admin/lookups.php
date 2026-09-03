<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN']);

$pdo = Db::get();

$plants = $pdo->query('SELECT id, code, name FROM plants ORDER BY code')->fetchAll();
$productionYears = $pdo->query('SELECT id, year_code FROM production_years ORDER BY year_code')->fetchAll();
$coachTypes = $pdo->query(
    'SELECT ct.id, ct.code, ct.name, cc.name AS category_name
     FROM coach_types ct
     JOIN coach_categories cc ON cc.id = ct.category_id
     WHERE ct.is_active = 1
     ORDER BY ct.name'
)->fetchAll();
$coachCategories = $pdo->query('SELECT id, code, name FROM coach_categories WHERE is_active = 1 ORDER BY name')->fetchAll();

Response::ok([
    'plants' => array_map(fn ($r) => ['id' => (int) $r['id'], 'code' => $r['code'], 'name' => $r['name']], $plants),
    'production_years' => array_map(fn ($r) => ['id' => (int) $r['id'], 'year_code' => $r['year_code']], $productionYears),
    'coach_types' => array_map(fn ($r) => [
        'id' => (int) $r['id'], 'code' => $r['code'], 'name' => $r['name'], 'category_name' => $r['category_name'],
    ], $coachTypes),
    'coach_categories' => array_map(fn ($r) => [
        'id' => (int) $r['id'], 'code' => $r['code'], 'name' => $r['name'],
    ], $coachCategories),
]);
