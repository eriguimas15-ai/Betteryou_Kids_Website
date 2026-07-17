<?php
require_once __DIR__ . '/conexao.php';

// Read JSON body
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$email = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
$senha = $input['senha'] ?? '';

if (!$email || !$senha) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password required']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, nome, email, senha_hash, tipo FROM utilizadores WHERE email = :email LIMIT 1');
$stmt->execute(['email' => $email]);
$user = $stmt->fetch();

if (!$user || !password_verify($senha, $user['senha_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

// Get profile id for aluno/professor
$profile_id = null;
if ($user['tipo'] === 'aluno') {
    $ps = $pdo->prepare('SELECT id, turma_id, numero_estudante FROM alunos_perfil WHERE utilizador_id = :uid LIMIT 1');
    $ps->execute(['uid' => $user['id']]);
    $perfil = $ps->fetch();
    if ($perfil) $profile_id = (int)$perfil['id'];
} elseif ($user['tipo'] === 'professor') {
    $ps = $pdo->prepare('SELECT id FROM professores_perfil WHERE utilizador_id = :uid LIMIT 1');
    $ps->execute(['uid' => $user['id']]);
    $perfil = $ps->fetch();
    if ($perfil) $profile_id = (int)$perfil['id'];
}

// Create token
$token = bin2hex(random_bytes(32));
$expires = (new DateTime())->modify('+8 hours')->format('Y-m-d H:i:s');
$ins = $pdo->prepare('INSERT INTO sessoes (utilizador_id, token, expires_at) VALUES (:uid, :token, :expires)');
$ins->execute(['uid' => $user['id'], 'token' => $token, 'expires' => $expires]);

$response = [
    'user' => [
        'id' => (int)$user['id'],
        'nome' => $user['nome'],
        'email' => $user['email'],
        'tipo' => $user['tipo'],
        'perfil_id' => $profile_id
    ],
    'token' => $token,
    'expires_at' => $expires
];

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response);
