-- Database: escola_db
-- Encoding: utf8mb4

CREATE DATABASE IF NOT EXISTS `escola_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `escola_db`;

-- Users table
CREATE TABLE IF NOT EXISTS `utilizadores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(150) NOT NULL,
  `email` VARCHAR(180) NOT NULL UNIQUE,
  `senha_hash` VARCHAR(255) NOT NULL,
  `tipo` ENUM('admin','professor','aluno') NOT NULL DEFAULT 'aluno',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_utilizadores_email ON utilizadores (email);

-- Professores perfil (opcional)
CREATE TABLE IF NOT EXISTS `professores_perfil` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilizador_id` INT NOT NULL,
  `departamento` VARCHAR(100),
  FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Alunos perfil
CREATE TABLE IF NOT EXISTS `alunos_perfil` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilizador_id` INT NOT NULL,
  `turma_id` INT DEFAULT NULL,
  `numero_estudante` VARCHAR(50),
  FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_alunos_perfil_utilizador_id ON alunos_perfil (utilizador_id);
CREATE INDEX idx_alunos_perfil_turma_id ON alunos_perfil (turma_id);

-- Turmas table
CREATE TABLE IF NOT EXISTS `turmas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL,
  `ano` VARCHAR(20),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Avaliacoes
CREATE TABLE IF NOT EXISTS `avaliacoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `aluno_id` INT NOT NULL,
  `disciplina` VARCHAR(100) NOT NULL,
  `nota` DECIMAL(5,2) NOT NULL,
  `periodo` VARCHAR(50) NOT NULL,
  `professor_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos_perfil(id) ON DELETE CASCADE,
  FOREIGN KEY (professor_id) REFERENCES professores_perfil(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_avaliacoes_aluno ON avaliacoes (aluno_id);

-- Faltas
CREATE TABLE IF NOT EXISTS `faltas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `aluno_id` INT NOT NULL,
  `disciplina` VARCHAR(100) NOT NULL,
  `data` DATE NOT NULL,
  `numero_faltas` INT NOT NULL DEFAULT 1,
  `justificada` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES alunos_perfil(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_faltas_aluno ON faltas (aluno_id);

-- Carrossel
CREATE TABLE IF NOT EXISTS `carrossel` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) DEFAULT NULL,
  `arquivo` VARCHAR(255) NOT NULL,
  `ordem` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Paginas de conteudo
CREATE TABLE IF NOT EXISTS `paginas_conteudo` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `titulo` VARCHAR(200) NOT NULL,
  `conteudo` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Noticias
CREATE TABLE IF NOT EXISTS `noticias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(200) NOT NULL,
  `resumo` VARCHAR(500),
  `conteudo` TEXT,
  `imagem` VARCHAR(255),
  `publicado_em` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sessões / Tokens
CREATE TABLE IF NOT EXISTS `sessoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `utilizador_id` INT NOT NULL,
  `token` VARCHAR(128) NOT NULL UNIQUE,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilizador_id) REFERENCES utilizadores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_sessoes_token ON sessoes (token);

-- Sample admin user (password: Admin123!)
INSERT IGNORE INTO utilizadores (id, nome, email, senha_hash, tipo)
VALUES (1, 'Admin', 'admin@escola.test', '$2y$12$MqzRWG1bP6zaG9YeX5EqFOb3zOZUTexzo6SB5FthfDdk6OLQaft96', 'admin');
-- The above hash is bcrypt for 'Admin123!'

COMMIT;

-- Admissions core: units, rooms, registrations and waitlist
CREATE TABLE IF NOT EXISTS `unidades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL UNIQUE,
  `morada` VARCHAR(255) DEFAULT NULL,
  `ativo` TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `salas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nome` VARCHAR(100) NOT NULL,
  `unidade_id` INT NOT NULL,
  `servico` VARCHAR(100) NOT NULL,
  `ano_letivo` VARCHAR(20) NOT NULL,
  `capacidade` INT NOT NULL,
  `matriculados` INT NOT NULL DEFAULT 0,
  `reservas_renovacao` INT NOT NULL DEFAULT 0,
  `reservas_inscricao` INT NOT NULL DEFAULT 0,
  `ativo` TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (`unidade_id`) REFERENCES `unidades`(`id`),
  UNIQUE KEY `uk_sala_ano` (`nome`, `unidade_id`, `ano_letivo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `inscricoes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `sala_id` INT DEFAULT NULL,
  `ano_letivo` VARCHAR(20) NOT NULL,
  `unidade` VARCHAR(100) NOT NULL,
  `servico` VARCHAR(100) NOT NULL,
  `crianca_nome` VARCHAR(180) NOT NULL,
  `crianca_nascimento` DATE NOT NULL,
  `crianca_sexo` VARCHAR(20) NOT NULL,
  `crianca_nacionalidade` VARCHAR(100) NOT NULL,
  `encarregado_nome` VARCHAR(180) NOT NULL,
  `encarregado_telefone` VARCHAR(50) NOT NULL,
  `encarregado_email` VARCHAR(180) NOT NULL,
  `encarregado_parentesco` VARCHAR(80) NOT NULL,
  `estado` ENUM('pendente_validacao','lista_espera','confirmada','cancelada') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`sala_id`) REFERENCES `salas`(`id`) ON DELETE SET NULL,
  INDEX `idx_inscricoes_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `unidades` (`id`, `nome`, `morada`) VALUES
  (1, 'Gika', 'Av. Cmte. Gika 150, Luanda'),
  (2, 'Patriota', 'Rua Urbanização Harmonia, Patriota');

INSERT IGNORE INTO `salas` (`nome`, `unidade_id`, `servico`, `ano_letivo`, `capacidade`, `matriculados`, `reservas_renovacao`) VALUES
  ('Sala Girassol', 1, 'Pré-Escolar', '2026/2027', 20, 18, 0),
  ('Sala Borboleta', 1, 'Creche', '2026/2027', 16, 13, 1),
  ('Sala Arco-Íris', 2, 'Jardim de Infância', '2026/2027', 18, 18, 0),
  ('Sala Sementinha', 2, 'ATL', '2026/2027', 24, 19, 2);
