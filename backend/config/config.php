<?php
// Local development configuration.
// In a real deployment, set CTS_JWT_SECRET (and the CTS_DB_* / CTS_CORS_ORIGIN
// vars) as actual environment variables rather than relying on any file here.

/**
 * Returns a strong random JWT signing secret. Honors CTS_JWT_SECRET if set
 * (required for a real deployment — multiple app instances must share one
 * secret). Otherwise generates a random 64-byte secret on first run and
 * persists it to a git-ignored local file, so local dev never falls back to
 * a hardcoded, publicly-known secret string.
 */
// This file is `require`d (not require_once) by several callers so each gets
// a fresh config array — guard the helper so it's only declared once per request.
if (!function_exists('cts_jwt_secret')) {
    function cts_jwt_secret(): string
    {
        $fromEnv = getenv('CTS_JWT_SECRET');
        if ($fromEnv) {
            return $fromEnv;
        }

        $secretFile = __DIR__ . '/.jwt_secret';
        if (is_readable($secretFile)) {
            $existing = trim((string) file_get_contents($secretFile));
            if ($existing !== '') {
                return $existing;
            }
        }

        $generated = bin2hex(random_bytes(64));
        file_put_contents($secretFile, $generated);
        chmod($secretFile, 0600);
        return $generated;
    }
}

return [
    'db' => [
        'host' => getenv('CTS_DB_HOST') ?: '127.0.0.1',
        'name' => getenv('CTS_DB_NAME') ?: 'cts_dev',
        'user' => getenv('CTS_DB_USER') ?: 'root',
        'pass' => getenv('CTS_DB_PASS') ?: '',
    ],
    'auth' => [
        'secret' => cts_jwt_secret(),
        'ttl_seconds' => 8 * 60 * 60, // 8 hours
    ],
    'cors' => [
        'allowed_origin' => getenv('CTS_CORS_ORIGIN') ?: 'http://localhost:5173',
    ],
];
