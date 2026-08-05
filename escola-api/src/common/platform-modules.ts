/** Módulos da plataforma escolar (chaves usadas em AccessProfile.modules). */
export const PLATFORM_MODULES = [
  { key: 'dashboard', label: 'Visão geral' },
  { key: 'painel', label: 'Painel executivo' },
  { key: 'portal', label: 'Portal do encarregado' },
  { key: 'inscricoes', label: 'Inscrições' },
  { key: 'renovacoes', label: 'Renovações' },
  { key: 'formularios', label: 'Formulários de admissão' },
  { key: 'ficha', label: 'Ficha do aluno' },
  { key: 'espera', label: 'Lista de espera' },
  { key: 'salas', label: 'Salas' },
  { key: 'turmas', label: 'Turmas' },
  { key: 'presencas', label: 'Presenças' },
  { key: 'academico', label: 'Académico' },
  { key: 'curriculo', label: 'Currículo' },
  { key: 'nee', label: 'NEE / PEI' },
  { key: 'reunioes', label: 'Reuniões e actas' },
  { key: 'comunicados', label: 'Comunicados' },
  { key: 'eventos', label: 'Eventos e festas' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'relatorios', label: 'Relatórios' },
  { key: 'actividades', label: 'Actividades' },
  { key: 'emprego', label: 'Vagas de emprego' },
  { key: 'conteudo', label: 'Conteúdo do site' },
  { key: 'unidades', label: 'Unidades' },
  { key: 'auditoria', label: 'Auditoria' },
  { key: 'backups', label: 'Cópias de segurança' },
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
    'painel',
    'portal',
    'inscricoes',
    'renovacoes',
    'formularios',
    'ficha',
    'espera',
    'salas',
    'turmas',
    'presencas',
    'academico',
    'curriculo',
    'nee',
    'reunioes',
    'comunicados',
    'eventos',
    'financeiro',
    'relatorios',
    'actividades',
    'emprego',
    'conteudo',
    'unidades',
    'auditoria',
  ],
  COMUNICACAO: [
    'inscricoes',
    'formularios',
    'comunicados',
    'eventos',
    'emprego',
    'conteudo',
  ],
  COORDENACAO: [
    'dashboard',
    'portal',
    'inscricoes',
    'renovacoes',
    'formularios',
    'ficha',
    'espera',
    'salas',
    'turmas',
    'presencas',
    'academico',
    'curriculo',
    'nee',
    'reunioes',
    'comunicados',
    'eventos',
    'actividades',
    'relatorios',
  ],
  PROFESSOR: [
    'dashboard',
    'presencas',
    'academico',
    'curriculo',
    'nee',
    'reunioes',
    'comunicados',
  ],
  ENCARREGADO: ['portal', 'inscricoes', 'renovacoes', 'ficha'],
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
