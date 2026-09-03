<?php

require_once __DIR__ . '/Response.php';

// Minimal JWT-shaped HMAC token: header.payload.signature, base64url encoded,
// signed with HMAC-SHA256. No external dependency; wire-compatible with real
// JWT libraries if we ever want to swap this out.
class Auth
{
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $padded = str_pad($data, strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + (4 - strlen($data) % 4), '=');
        return base64_decode(strtr($padded, '-_', '+/'));
    }

    private static function secret(): string
    {
        $config = require __DIR__ . '/../config/config.php';
        return $config['auth']['secret'];
    }

    private static function ttlSeconds(): int
    {
        $config = require __DIR__ . '/../config/config.php';
        return $config['auth']['ttl_seconds'];
    }

    public static function issueToken(array $userPayload): string
    {
        $header = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $userPayload;
        $payload['iat'] = time();
        $payload['exp'] = time() + self::ttlSeconds();
        $encodedPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', "$header.$encodedPayload", self::secret(), true);
        $encodedSignature = self::base64UrlEncode($signature);

        return "$header.$encodedPayload.$encodedSignature";
    }

    public static function verifyToken(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$header, $payload, $signature] = $parts;

        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", self::secret(), true)
        );
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $decoded = json_decode(self::base64UrlDecode($payload), true);
        if (!is_array($decoded) || !isset($decoded['exp']) || $decoded['exp'] < time()) {
            return null;
        }

        return $decoded;
    }

    private static function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);
        if (!$header || !preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return null;
        }
        return $matches[1];
    }

    /** Returns the decoded token payload for the current request, or halts with 401. */
    public static function currentUser(): array
    {
        $token = self::bearerToken();
        if (!$token) {
            Response::error('Missing Authorization header.', 401);
        }
        $payload = self::verifyToken($token);
        if (!$payload) {
            Response::error('Invalid or expired token.', 401);
        }
        return $payload;
    }

    /** Halts with 403 unless the current user's role is in $allowedRoles. */
    public static function requireRole(array $allowedRoles): array
    {
        $user = self::currentUser();
        if (!in_array($user['role'], $allowedRoles, true)) {
            Response::error('You do not have permission to perform this action.', 403);
        }
        return $user;
    }
}
