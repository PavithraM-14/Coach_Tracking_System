<?php

$config = require __DIR__ . '/../config/config.php';

header('Access-Control-Allow-Origin: ' . $config['cors']['allowed_origin']);
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
