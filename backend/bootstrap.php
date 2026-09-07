<?php

declare(strict_types=1);

require_once __DIR__ . '/middleware/cors.php';
require_once __DIR__ . '/lib/Db.php';
require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/Auth.php';
require_once __DIR__ . '/lib/Schedule.php';

/** Decodes the JSON request body into an associative array (empty array if none/invalid). */
function requestBody(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
