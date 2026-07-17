<?php
require_once __DIR__ . '/conexao.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, slug, titulo, conteudo, updated_at FROM paginas_conteudo ORDER BY id');
    $pages = $stmt->fetchAll();
    // sanitize output
    array_walk($pages, function (&$p) {
        $p['titulo'] = htmlspecialchars($p['titulo'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $p['conteudo'] = htmlspecialchars($p['conteudo'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    });
    echo json_encode(['pages' => $pages]);
    exit;
}

if ($method === 'POST') {
    // Expect JSON with slug, titulo, conteudo
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || !isset($input['slug'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input']);
        exit;
    }
    $slug = preg_replace('/[^a-z0-9\-\_]/i', '', $input['slug']);
    $titulo = $input['titulo'] ?? '';
    $conteudo = $input['conteudo'] ?? '';

    // Upsert
    $stmt = $pdo->prepare('INSERT INTO paginas_conteudo (slug, titulo, conteudo) VALUES (:slug, :titulo, :conteudo)
        ON DUPLICATE KEY UPDATE titulo = :titulo2, conteudo = :conteudo2');
    $stmt->execute([
        'slug' => $slug,
        'titulo' => $titulo,
        'conteudo' => $conteudo,
        'titulo2' => $titulo,
        'conteudo2' => $conteudo
    ]);

    echo json_encode(['status' => 'ok']);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
