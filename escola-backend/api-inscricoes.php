<?php
require_once __DIR__ . '/conexao.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$required = ['ano_letivo', 'unidade', 'servico', 'crianca_nome', 'crianca_nascimento', 'crianca_sexo', 'crianca_nacionalidade', 'encarregado_nome', 'encarregado_telefone', 'encarregado_email', 'encarregado_parentesco'];
foreach ($required as $field) {
    if (empty(trim((string)($input[$field] ?? '')))) {
        http_response_code(422);
        echo json_encode(['error' => "Missing field: $field"]);
        exit;
    }
}
if (!filter_var($input['encarregado_email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

try {
    $pdo->beginTransaction();
    $roomQuery = $pdo->prepare(
        'SELECT s.* FROM salas s JOIN unidades u ON u.id = s.unidade_id
         WHERE u.nome = :unidade AND s.servico = :servico AND s.ano_letivo = :ano AND s.ativo = 1
         ORDER BY s.id LIMIT 1 FOR UPDATE'
    );
    $roomQuery->execute(['unidade' => $input['unidade'], 'servico' => $input['servico'], 'ano' => $input['ano_letivo']]);
    $room = $roomQuery->fetch();
    $vacancies = $room ? ((int)$room['capacidade'] - (int)$room['matriculados'] - (int)$room['reservas_renovacao'] - (int)$room['reservas_inscricao']) : 0;
    $status = $vacancies > 0 ? 'pendente_validacao' : 'lista_espera';
    $roomId = $room['id'] ?? null;

    $insert = $pdo->prepare(
        'INSERT INTO inscricoes (sala_id, ano_letivo, unidade, servico, crianca_nome, crianca_nascimento, crianca_sexo, crianca_nacionalidade, encarregado_nome, encarregado_telefone, encarregado_email, encarregado_parentesco, estado)
         VALUES (:sala_id, :ano_letivo, :unidade, :servico, :crianca_nome, :crianca_nascimento, :crianca_sexo, :crianca_nacionalidade, :encarregado_nome, :encarregado_telefone, :encarregado_email, :encarregado_parentesco, :estado)'
    );
    $insert->execute([
        'sala_id' => $roomId, 'ano_letivo' => $input['ano_letivo'], 'unidade' => $input['unidade'], 'servico' => $input['servico'],
        'crianca_nome' => trim($input['crianca_nome']), 'crianca_nascimento' => $input['crianca_nascimento'], 'crianca_sexo' => trim($input['crianca_sexo']),
        'crianca_nacionalidade' => trim($input['crianca_nacionalidade']), 'encarregado_nome' => trim($input['encarregado_nome']),
        'encarregado_telefone' => trim($input['encarregado_telefone']), 'encarregado_email' => trim($input['encarregado_email']),
        'encarregado_parentesco' => trim($input['encarregado_parentesco']), 'estado' => $status
    ]);
    $registrationId = (int)$pdo->lastInsertId();
    if ($status === 'pendente_validacao') {
        $pdo->prepare('UPDATE salas SET reservas_inscricao = reservas_inscricao + 1 WHERE id = :id')->execute(['id' => $roomId]);
    }
    $pdo->commit();
    http_response_code(201);
    echo json_encode(['id' => $registrationId, 'estado' => $status, 'vagas_disponiveis' => max(0, $vacancies - ($status === 'pendente_validacao' ? 1 : 0))]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Registration error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Could not register application']);
}
