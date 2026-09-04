<?php

require_once __DIR__ . '/../../bootstrap.php';
require_once __DIR__ . '/../../lib/Assignment.php';

// Which pipeline modules the logged-in employee is actually configured to
// work, not just role-eligible for — e.g. a PAINT user might be set up for
// Paint In only, Paint Out only, or both, per the Supervisor-Coach
// Assignments Matrix; an ASSEMBLY_PRODUCTION user similarly per their
// Assembly In / Assembly Out skills. The frontend uses this to show/hide
// nav links and block direct navigation to a stage the employee isn't
// configured for.
$currentUser = Auth::requireRole(['FURNISHING', 'PAINT', 'ASSEMBLY_PRODUCTION', 'OUTTURN_DISPATCH']);

$pdo = Db::get();
$modules = Assignment::userCapableModules($pdo, (int) $currentUser['sub'], $currentUser['role']);

Response::ok(['modules' => $modules]);
