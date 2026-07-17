/** Módulos da plataforma escolar (chaves usadas em AccessProfile.modules). */
export const PLATFORM_MODULES = [
  { key: 'dashboard', label: 'Visão geral' },
  { key: 'inscricoes', label: 'Inscrições' },
  { key: 'renovacoes', label: 'Renovações' },
  { key: 'ficha', label: 'Ficha do aluno' },
  { key: 'espera', label: 'Lista de espera' },
  { key: 'salas', label: 'Salas' },
  { key: 'turmas', label: 'Turmas' },
  { key: 'emprego', label: 'Vagas de emprego' },
  { key: 'conteudo', label: 'Conteúdo do site' },
  { key: 'acessos', label: 'Utilizadores e acessos' },
] as const;

export type PlatformModuleKey = (typeof PLATFORM_MODULES)[number]['key'];

export const PUBLIC_MODULES: PlatformModuleKey[] = [
  'inscricoes',
  'renovacoes',
  'emprego',
];

export const DEFAULT_PROFILE_MODULES: Record<string, PlatformModuleKey[]> = {
  ADMIN: PLATFORM_MODULES.map((m) => m.key),
  DIRECAO: [
    'dashboard',
    'inscricoes',
    'renovacoes',
    'ficha',
    'espera',
    'salas',
    'turmas',
    'emprego',
    'conteudo',
  ],
  COMUNICACAO: ['inscricoes', 'emprego', 'conteudo'],
  COORDENACAO: [
    'dashboard',
    'inscricoes',
    'renovacoes',
    'ficha',
    'espera',
    'salas',
    'turmas',
  ],
  PROFESSOR: ['dashboard'],
  ENCARREGADO: ['inscricoes', 'renovacoes', 'ficha'],
  ALUNO: [],
};

export function parseModules(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((v): v is string => typeof v === 'string')
        : [];
    } catch {
      return [];
    }
  }
  return [];
}
