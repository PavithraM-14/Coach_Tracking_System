<?php

// Minimal SMTP-over-STARTTLS client (no Composer/PHPMailer on this machine —
// this is a self-contained ~80 line replacement covering exactly what
// Gmail's smtp.gmail.com:587 needs: EHLO, STARTTLS, AUTH LOGIN, one message).
class Mailer
{
    /** Reads one (possibly multi-line) SMTP reply and returns it, throwing if the code doesn't match. */
    private static function expect($socket, int $code): string
    {
        $response = '';
        do {
            $line = fgets($socket, 515);
            if ($line === false) {
                throw new RuntimeException('SMTP connection closed unexpectedly.');
            }
            $response .= $line;
        } while (isset($line[3]) && $line[3] === '-');

        if ((int) substr($response, 0, 3) !== $code) {
            throw new RuntimeException("SMTP error, expected {$code}: {$response}");
        }
        return $response;
    }

    private static function command($socket, string $command, int $expectCode): string
    {
        fwrite($socket, $command . "\r\n");
        return self::expect($socket, $expectCode);
    }

    public static function send(string $to, string $subject, string $htmlBody): bool
    {
        $config = require __DIR__ . '/../config/config.php';
        $mail = $config['mail'];

        if (!$mail['host'] || !$mail['username'] || !$mail['password']) {
            error_log('Mailer: SMTP is not configured (backend/config/.mail_credentials missing/incomplete).');
            return false;
        }

        $socket = @fsockopen($mail['host'], $mail['port'], $errno, $errstr, 15);
        if (!$socket) {
            error_log("Mailer: connection to {$mail['host']}:{$mail['port']} failed: {$errstr} ({$errno})");
            return false;
        }
        stream_set_timeout($socket, 15);

        try {
            self::expect($socket, 220);
            self::command($socket, 'EHLO localhost', 250);
            self::command($socket, 'STARTTLS', 220);

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('TLS negotiation with SMTP server failed.');
            }

            self::command($socket, 'EHLO localhost', 250);
            self::command($socket, 'AUTH LOGIN', 334);
            self::command($socket, base64_encode($mail['username']), 334);
            self::command($socket, base64_encode($mail['password']), 235);
            self::command($socket, "MAIL FROM:<{$mail['username']}>", 250);
            self::command($socket, "RCPT TO:<{$to}>", 250);
            self::command($socket, 'DATA', 354);

            $headers = "From: {$mail['from_name']} <{$mail['username']}>\r\n";
            $headers .= "To: <{$to}>\r\n";
            $headers .= "Subject: {$subject}\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

            // Dot-stuff any line that starts with '.' so the SMTP server doesn't
            // read it as the end-of-DATA terminator.
            $safeBody = preg_replace('/^\./m', '..', $htmlBody);
            fwrite($socket, $headers . "\r\n" . $safeBody . "\r\n.\r\n");
            self::expect($socket, 250);

            fwrite($socket, "QUIT\r\n");
            fclose($socket);
            return true;
        } catch (Throwable $e) {
            error_log('Mailer: ' . $e->getMessage());
            fclose($socket);
            return false;
        }
    }
}
