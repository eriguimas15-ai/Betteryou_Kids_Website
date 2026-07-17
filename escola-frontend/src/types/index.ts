export type User = {
  id: number;
  nome: string;
  email: string;
  tipo: 'aluno' | 'professor' | 'admin' | string;
};

export type Turma = {
  id: number;
  nome: string;
  ano?: string;
};

export type Avaliacao = {
  id: number;
  disciplina: string;
  nota: number;
  periodo: string;
  created_at?: string;
};

export type Falta = {
  id: number;
  disciplina: string;
  data: string;
  numero_faltas: number;
  justificada: number;
};

export type AlunoPerfil = {
  id: number;
  turma_id?: number;
  numero_estudante?: string;
};
