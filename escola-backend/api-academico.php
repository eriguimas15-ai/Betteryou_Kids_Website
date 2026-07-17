<?php
require_once __DIR__ . '/conexao.php';

header('Content-Type: application/json; charset=utf-8');

// Authenticate via Bearer token
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!$auth || stripos($auth, 'Bearer ') !== 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
$token = trim(substr($auth, 7));

// Validate session
$ps = $pdo->prepare('SELECT s.utilizador_id, u.tipo FROM sessoes s JOIN utilizadores u ON s.utilizador_id = u.id WHERE s.token = :token AND s.expires_at > NOW() LIMIT 1');
$ps->execute(['token' => $token]);
$session = $ps->fetch();
if (!$session) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

$userId = (int)$session['utilizador_id'];
$userType = $session['tipo'];

$method = $_SERVER['REQUEST_METHOD'];

// For aluno: return only their data (notes, faltas, turma)
if ($method === 'GET' && $userType === 'aluno') {
    // Find aluno_perfil
    $ps = $pdo->prepare('SELECT id, turma_id, numero_estudante FROM alunos_perfil WHERE utilizador_id = :uid LIMIT 1');
    $ps->execute(['uid' => $userId]);
    $aluno = $ps->fetch();
    if (!$aluno) {
        http_response_code(404);
        echo json_encode(['error' => 'Aluno profile not found']);
        exit;
    }
    $alunoId = (int)$aluno['id'];

    // Turma
    $turma = null;
    if ($aluno['turma_id']) {
        $ps = $pdo->prepare('SELECT id, nome, ano FROM turmas WHERE id = :tid LIMIT 1');
        $ps->execute(['tid' => $aluno['turma_id']]);
        $turma = $ps->fetch();
    }

    // Notas
    $ps = $pdo->prepare('SELECT id, disciplina, nota, periodo, created_at FROM avaliacoes WHERE aluno_id = :aid ORDER BY periodo, disciplina');
    $ps->execute(['aid' => $alunoId]);
    $notas = $ps->fetchAll();

    // Faltas
    $ps = $pdo->prepare('SELECT id, disciplina, data, numero_faltas, justificada FROM faltas WHERE aluno_id = :aid ORDER BY data DESC');
    $ps->execute(['aid' => $alunoId]);
    $faltas = $ps->fetchAll();

    echo json_encode([
        'aluno' => [
            'perfil' => $aluno,
            'turma' => $turma,
            'notas' => $notas,
            'faltas' => $faltas
        ]
    ]);
    exit;
}

// For professor or admin: allow listing students and inserting records
if ($userType === 'professor' || $userType === 'admin') {
    if ($method === 'GET') {
        $action = $_GET['action'] ?? '';
        if ($action === 'list_students') {
            // Return list of students with perfil id and name
            $stmt = $pdo->query('SELECT ap.id AS perfil_id, u.nome, u.email, ap.numero_estudante, ap.turma_id FROM alunos_perfil ap JOIN utilizadores u ON ap.utilizador_id = u.id ORDER BY u.nome');
            $students = $stmt->fetchAll();
            echo json_encode(['students' => $students]);
            exit;
        }
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['action'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid input']);
            exit;
        }
        $action = $input['action'];
        if ($action === 'add_grade') {
            $aluno_id = intval($input['aluno_id'] ?? 0);
            $disciplina = substr(trim($input['disciplina'] ?? ''), 0, 100);
            $nota = floatval($input['nota'] ?? 0);
            $periodo = substr(trim($input['periodo'] ?? 'Geral'), 0, 50);

            if (!$aluno_id || !$disciplina) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing fields']);
                exit;
            }

            $professor_perfil_id = null;
            // If professor has a perfil record, link it
            $ps = $pdo->prepare('SELECT id FROM professores_perfil WHERE utilizador_id = :uid LIMIT 1');
            $ps->execute(['uid' => $userId]);
            $pp = $ps->fetch();
            if ($pp) $professor_perfil_id = (int)$pp['id'];

            $ins = $pdo->prepare('INSERT INTO avaliacoes (aluno_id, disciplina, nota, periodo, professor_id) VALUES (:aluno_id, :disciplina, :nota, :periodo, :prof)');
            $ins->execute(['aluno_id' => $aluno_id, 'disciplina' => $disciplina, 'nota' => $nota, 'periodo' => $periodo, 'prof' => $professor_perfil_id]);

            echo json_encode(['status' => 'ok']);
            exit;
        }

        if ($action === 'add_absence') {
            $aluno_id = intval($input['aluno_id'] ?? 0);
            $disciplina = substr(trim($input['disciplina'] ?? ''), 0, 100);
            $data = $input['data'] ?? null;
            $numero_faltas = intval($input['numero_faltas'] ?? 1);
            $justificada = isset($input['justificada']) ? (int)$input['justificada'] : 0;

            if (!$aluno_id || !$disciplina || !$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing fields']);
                exit;
            }

            $ins = $pdo->prepare('INSERT INTO faltas (aluno_id, disciplina, data, numero_faltas, justificada) VALUES (:aluno_id, :disciplina, :data, :numero_faltas, :justificada)');
            $ins->execute(['aluno_id' => $aluno_id, 'disciplina' => $disciplina, 'data' => $data, 'numero_faltas' => $numero_faltas, 'justificada' => $justificada]);

            echo json_encode(['status' => 'ok']);
            exit;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
        exit;
    }
}

http_response_code(403);
echo json_encode(['error' => 'Forbidden']);
