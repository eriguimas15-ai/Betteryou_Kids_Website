<?php
require_once __DIR__ . '/conexao.php';

header('Content-Type: application/json; charset=utf-8');

// Allowed mime types
$allowed = [
    'image/jpeg' => '.jpg',
    'image/png' => '.png',
    'image/webp' => '.webp'
];
$maxSize = 2 * 1024 * 1024; // 2MB
$uploadDir = __DIR__ . '/uploads/carrossel/';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, titulo, arquivo, ordem, created_at FROM carrossel ORDER BY ordem, id');
    $items = $stmt->fetchAll();
    echo json_encode(['items' => $items]);
    exit;
}

if ($method === 'POST') {
    // Expect multipart/form-data: file, titulo, id (optional for replace), ordem
    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'File missing']);
        exit;
    }
    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'Upload error']);
        exit;
    }
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large']);
        exit;
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!isset($allowed[$mime])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid mime type']);
        exit;
    }
    $ext = $allowed[$mime];
    $newName = bin2hex(random_bytes(12)) . $ext;

    $titulo = substr(trim($_POST['titulo'] ?? ''), 0, 150);
    $ordem = intval($_POST['ordem'] ?? 0);
    $replaceId = isset($_POST['id']) ? intval($_POST['id']) : null;

    // Move file
    $dest = $uploadDir . $newName;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to store file']);
        exit;
    }

    // If replacing, delete old file
    if ($replaceId) {
        $ps = $pdo->prepare('SELECT arquivo FROM carrossel WHERE id = :id');
        $ps->execute(['id' => $replaceId]);
        $old = $ps->fetchColumn();
        if ($old) {
            $oldPath = $uploadDir . basename($old);
            if (is_file($oldPath)) @unlink($oldPath);
        }
        $upd = $pdo->prepare('UPDATE carrossel SET titulo = :titulo, arquivo = :arquivo, ordem = :ordem WHERE id = :id');
        $upd->execute(['titulo' => $titulo, 'arquivo' => $newName, 'ordem' => $ordem, 'id' => $replaceId]);
        echo json_encode(['status' => 'updated']);
        exit;
    }

    $ins = $pdo->prepare('INSERT INTO carrossel (titulo, arquivo, ordem) VALUES (:titulo, :arquivo, :ordem)');
    $ins->execute(['titulo' => $titulo, 'arquivo' => $newName, 'ordem' => $ordem]);

    echo json_encode(['status' => 'uploaded']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
