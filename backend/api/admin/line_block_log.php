<?php

require_once __DIR__ . '/../../bootstrap.php';

Auth::requireRole(['ADMIN', 'PAINT_ADMIN', 'ASSEMBLY_ADMIN']);

$pdo = Db::get();

// "PAINT" as a prefix covers PAINT_LINE + PAINT_SLOT together; "ASSEMBLY"
// likewise covers the assembly pair — the frontend passes just the pool
// family, not each exact value.
$pool = trim((string) ($_GET['pool'] ?? ''));
$sql = 'SELECT l.pool, l.target_label, l.action, l.created_at, u.full_name AS performed_by
        FROM line_block_log l
        JOIN users u ON u.id = l.performed_by_user_id';
$params = [];
if ($pool !== '' && preg_match('/^[A-Z]+$/', $pool)) {
    $sql .= ' WHERE l.pool LIKE :pool_prefix';
    $params['pool_prefix'] = "{$pool}%";
}
$sql .= ' ORDER BY l.created_at DESC LIMIT 20';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

Response::ok(['data' => array_map(fn ($r) => [
    'pool' => $r['pool'],
    'target_label' => $r['target_label'],
    'action' => $r['action'],
    'performed_by' => $r['performed_by'],
    'created_at' => $r['created_at'],
], $rows)]);
