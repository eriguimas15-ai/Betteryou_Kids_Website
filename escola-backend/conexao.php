<?php
// conexao.php - PDO connection with CORS and secure error handling
// CORS: allow only known development origins by echoing the Origin header
$allowed_origins = [
    'http://escola-frontend.test',
    'http://localhost:5173'
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowed_origins, true)) {
    header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$DB_HOST = '127.0.0.1';
$DB_NAME = 'escola_db';
$DB_USER = 'root';
$DB_PASS = '';
$DSN = "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($DSN, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
    // Hide details from client
    error_log('DB Connection error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection error']);
    exit;
}
