/** Tipos e defaults para Jornada, Serviços e Actividades no CMS. */

export const CMS_JORNADA_SLUG = "sobre";
export const CMS_JORNADA_SECTION = "jornada_items";
export const CMS_SERVICOS_SLUG = "servicos";
export const CMS_SERVICOS_SECTION = "service_cards";
export const CMS_ACTIVIDADES_SLUG = "actividades";
export const CMS_ACTIVIDADES_SECTION = "activity_cards";

export type CmsThemeColor =
  | "pink"
  | "blue"
  | "green"
  | "secondary"
  | "accent"
  | "purple"
  | "red";

export type CmsIconName =
  | "Sparkles"
  | "MapPin"
  | "Users"
  | "Trophy"
  | "GraduationCap"
  | "Heart"
  | "Award"
  | "Baby"
  | "Clock"
  | "Gift"
  | "Globe"
  | "Star"
  | "Music"
  | "Dumbbell"
  | "Palette"
  | "TreePine"
  | "BookOpen"
  | "Utensils";

export type CmsJourneyItem = {
  id: string;
  year: string;
  title: string;
  description: string;
  icon: CmsIconName;
  color: CmsThemeColor;
};

export type CmsServiceCard = {
  id: string;
  title: string;
  ageRange: string;
  description: string;
  features: string[];
  icon: CmsIconName;
  color: CmsThemeColor;
};

export type CmsActivityCard = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: CmsIconName;
  color: CmsThemeColor;
  /** URL pública da imagem (upload CMS); vazio = fallback no site. */
  imageUrl: string;
};

export const CMS_THEME_COLOR_OPTIONS: Array<{
  value: CmsThemeColor;
  label: string;
}> = [
  { value: "pink", label: "Rosa" },
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "secondary", label: "Secundária" },
  { value: "accent", label: "Destaque" },
  { value: "purple", label: "Roxo" },
  { value: "red", label: "Vermelho" },
];

export const CMS_ICON_OPTIONS: Array<{ value: CmsIconName; label: string }> = [
  { value: "Sparkles", label: "Brilho" },
  { value: "MapPin", label: "Local" },
  { value: "Users", label: "Pessoas" },
  { value: "Trophy", label: "Troféu" },
  { value: "GraduationCap", label: "Graduação" },
  { value: "Heart", label: "Coração" },
  { value: "Award", label: "Prémio" },
  { value: "Baby", label: "Bebé" },
  { value: "Clock", label: "Relógio" },
  { value: "Gift", label: "Presente" },
  { value: "Globe", label: "Globo" },
  { value: "Star", label: "Estrela" },
  { value: "Music", label: "Música" },
  { value: "Dumbbell", label: "Desporto" },
  { value: "Palette", label: "Arte" },
  { value: "TreePine", label: "Natureza" },
  { value: "BookOpen", label: "Livro" },
  { value: "Utensils", label: "Culinária" },
];

export const DEFAULT_CMS_JOURNEY: CmsJourneyItem[] = [
  {
    id: "jornada-1",
    year: "2021",
    title: "Fundação",
    description:
      "Nascimento da Betteryou Kids com o sonho de revolucionar a educação infantil",
    icon: "Sparkles",
    color: "pink",
  },
  {
    id: "jornada-2",
    year: "2021",
    title: "Primeira Unidade",
    description: "Abertura da primeira unidade com metodologia inovadora",
    icon: "MapPin",
    color: "blue",
  },
  {
    id: "jornada-3",
    year: "2023",
    title: "Expansão",
    description: "Crescimento da comunidade e ampliação das actividades",
    icon: "Users",
    color: "green",
  },
  {
    id: "jornada-4",
    year: "2024",
    title: "Reconhecimento",
    description:
      "Considerada pelos pais como melhor instituição de educação infantil",
    icon: "Trophy",
    color: "accent",
  },
  {
    id: "jornada-5",
    year: "2025",
    title: "Abertura do Novo Espaço",
    description:
      "Inauguração do novo espaço da Betteryou Kids em 1 de Setembro de 2025, ampliando o atendimento e actividades.",
    icon: "MapPin",
    color: "blue",
  },
  {
    id: "jornada-6",
    year: "2025",
    title: "Segunda Unidade",
    description:
      "Abertura da segunda unidade após a mudança para o novo espaço, aumentando a capacidade de atendimento.",
    icon: "MapPin",
    color: "secondary",
  },
  {
    id: "jornada-7",
    year: "2026",
    title: "Abertura do 1º Ciclo",
    description:
      "Início das actividades do 1º Ciclo a partir de 14 de Setembro de 2026, com projecto pedagógico expandido.",
    icon: "GraduationCap",
    color: "secondary",
  },
];

export const DEFAULT_CMS_SERVICES: CmsServiceCard[] = [
  {
    id: "svc-1",
    title: "Creche",
    ageRange: "1-3 anos",
    description:
      "Cuidados especializados para os primeiros anos, com foco no desenvolvimento motor, emocional e cognitivo.",
    features: [
      "Cuidados personalizados",
      "Desenvolvimento motor",
      "Primeiras interações sociais",
      "Alimentação saudável",
      "Ambiente seguro e acolhedor",
    ],
    icon: "Baby",
    color: "pink",
  },
  {
    id: "svc-2",
    title: "Pré-Escolar",
    ageRange: "3-5 anos",
    description:
      "Preparação para a vida escolar através de actividades lúdicas e educativas que estimulam a curiosidade.",
    features: [
      "Preparação escolar",
      "Actividades lúdicas",
      "Desenvolvimento da linguagem",
      "Coordenação motora",
      "Socialização",
    ],
    icon: "Users",
    color: "secondary",
  },
  {
    id: "svc-3",
    title: "Jardim de Infância",
    ageRange: "5-6 anos",
    description:
      "Transição suave para o ensino primário com actividades que desenvolvem a autonomia e responsabilidade.",
    features: [
      "Preparação para o primário",
      "Desenvolvimento da autonomia",
      "Iniciação à leitura e escrita",
      "Raciocínio lógico",
      "Responsabilidade social",
    ],
    icon: "GraduationCap",
    color: "green",
  },
  {
    id: "svc-4",
    title: "1º Ciclo",
    ageRange: "6-10 anos",
    description:
      "Apoio educacional completo para o 1º Ciclo do Ensino Básico, com reforço escolar, actividades criativas e acompanhamento socioemocional.",
    features: [
      "Reforço escolar e trabalhos de casa",
      "Aulas de apoio em português, matemática e ciências",
      "Actividades lúdicas que fortalecem a autonomia",
      "Estímulo à leitura e expressão criativa",
      "Preparação para avaliações e organização do estudo",
      "Horários flexíveis adaptados às famílias",
    ],
    icon: "GraduationCap",
    color: "accent",
  },
  {
    id: "svc-5",
    title: "ATL",
    ageRange: "3-10 anos",
    description:
      "Actividades de tempos livres que complementam o ensino regular com diversão e aprendizagem.",
    features: [
      "Apoio aos trabalhos de casa",
      "Actividades recreativas",
      "Desenvolvimento de hobbies",
      "Convívio social",
      "Flexibilidade de horários",
    ],
    icon: "Clock",
    color: "purple",
  },
  {
    id: "svc-6",
    title: "Festas e Eventos Infantis",
    ageRange: "3-10 anos",
    description:
      "Transformamos cada celebração numa experiência única, com um espaço acolhedor, divertido e preparado para receber aniversários, baptizados, festas temáticas e outros eventos infantis.",
    features: [
      "Aluguer exclusivo do espaço",
      "Parque de estacionamento",
      "Ambiente seguro e confortável",
      "Apoio na organização do evento",
      "Festas de aniversário temáticas",
      "Área de brincadeiras e entretenimento",
      "Flexibilidade de horários",
      "Espaço amplo para família e convidados",
      "Pacotes adaptados às suas necessidades",
    ],
    icon: "Gift",
    color: "red",
  },
];

export const DEFAULT_CMS_ACTIVITIES: CmsActivityCard[] = [
  {
    id: "act-1",
    title: "Música",
    description:
      "Exploração musical com instrumentos, canto e movimento corporal para desenvolvimento rítmico e auditivo.",
    category: "Artística",
    color: "pink",
    icon: "Music",
    imageUrl: "",
  },
  {
    id: "act-2",
    title: "Jiu-Jitsu",
    description:
      "Arte marcial que desenvolve disciplina, respeito, coordenação motora e autoconfiança.",
    category: "Desportiva",
    color: "blue",
    icon: "Dumbbell",
    imageUrl: "",
  },
  {
    id: "act-3",
    title: "Ballet",
    description:
      "Dança clássica que promove graciosidade, equilíbrio, postura e expressão artística.",
    category: "Artística",
    color: "pink",
    icon: "Palette",
    imageUrl: "",
  },
  {
    id: "act-4",
    title: "Actividades na Natureza",
    description:
      "Exploração do ambiente natural, jardinagem e consciência ecológica.",
    category: "Natureza",
    color: "green",
    icon: "TreePine",
    imageUrl: "",
  },
  {
    id: "act-5",
    title: "Artes Plásticas",
    description:
      "Pintura, desenho, escultura e artesanato para estimular a criatividade e expressão.",
    category: "Artística",
    color: "accent",
    icon: "Palette",
    imageUrl: "",
  },
  {
    id: "act-6",
    title: "A Magia das Histórias",
    description:
      "Desenvolvimento da linguagem, imaginação e amor pela leitura através de narrativas envolventes.",
    category: "Educativa",
    color: "secondary",
    icon: "BookOpen",
    imageUrl: "",
  },
  {
    id: "act-7",
    title: "Culinária Infantil",
    description:
      "Introdução à culinária saudável, desenvolvendo coordenação motora e autonomia.",
    category: "Prática",
    color: "accent",
    icon: "Utensils",
    imageUrl: "",
  },
  {
    id: "act-8",
    title: "Línguas Estrangeiras",
    description:
      "Introdução lúdica ao inglês e outras línguas através de jogos e músicas.",
    category: "Educativa",
    color: "blue",
    icon: "Globe",
    imageUrl: "",
  },
];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const ICON_SET = new Set(CMS_ICON_OPTIONS.map((o) => o.value));
const COLOR_SET = new Set(CMS_THEME_COLOR_OPTIONS.map((o) => o.value));

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asIcon(value: unknown, fallback: CmsIconName): CmsIconName {
  const s = String(value || "");
  return ICON_SET.has(s as CmsIconName) ? (s as CmsIconName) : fallback;
}

function asColor(value: unknown, fallback: CmsThemeColor): CmsThemeColor {
  const s = String(value || "");
  return COLOR_SET.has(s as CmsThemeColor) ? (s as CmsThemeColor) : fallback;
}

export function createEmptyJourneyItem(): CmsJourneyItem {
  return {
    id: newId("jornada"),
    year: new Date().getFullYear().toString(),
    title: "",
    description: "",
    icon: "Sparkles",
    color: "pink",
  };
}

export function createEmptyServiceCard(): CmsServiceCard {
  return {
    id: newId("svc"),
    title: "",
    ageRange: "",
    description: "",
    features: [""],
    icon: "Baby",
    color: "pink",
  };
}

export function createEmptyActivityCard(): CmsActivityCard {
  return {
    id: newId("act"),
    title: "",
    description: "",
    category: "Artística",
    icon: "Music",
    color: "pink",
    imageUrl: "",
  };
}

function normalizeJourney(raw: unknown, index: number): CmsJourneyItem | null {
  const o = asObject(raw);
  if (!o) return null;
  const fallback = DEFAULT_CMS_JOURNEY[index % DEFAULT_CMS_JOURNEY.length];
  return {
    id: String(o.id || `jornada-${index + 1}`),
    year: String(o.year ?? fallback.year),
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    icon: asIcon(o.icon, fallback.icon),
    color: asColor(o.color, fallback.color),
  };
}

function normalizeService(raw: unknown, index: number): CmsServiceCard | null {
  const o = asObject(raw);
  if (!o) return null;
  const fallback = DEFAULT_CMS_SERVICES[index % DEFAULT_CMS_SERVICES.length];
  const featuresRaw = Array.isArray(o.features) ? o.features : fallback.features;
  const features = featuresRaw
    .map((f) => String(f ?? "").trim())
    .filter(Boolean);
  return {
    id: String(o.id || `svc-${index + 1}`),
    title: String(o.title ?? ""),
    ageRange: String(o.ageRange ?? o.age ?? ""),
    description: String(o.description ?? ""),
    features: features.length ? features : [...fallback.features],
    icon: asIcon(o.icon, fallback.icon),
    color: asColor(o.color, fallback.color),
  };
}

function normalizeActivity(raw: unknown, index: number): CmsActivityCard | null {
  const o = asObject(raw);
  if (!o) return null;
  const fallback = DEFAULT_CMS_ACTIVITIES[index % DEFAULT_CMS_ACTIVITIES.length];
  return {
    id: String(o.id || `act-${index + 1}`),
    title: String(o.title ?? ""),
    description: String(o.description ?? ""),
    category: String(o.category ?? fallback.category),
    icon: asIcon(o.icon, fallback.icon),
    color: asColor(o.color, fallback.color),
    imageUrl: String(o.imageUrl ?? ""),
  };
}

export function parseJourneyJson(
  raw: string | undefined | null,
): CmsJourneyItem[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .map((item, i) => normalizeJourney(item, i))
      .filter((s): s is CmsJourneyItem => Boolean(s));
  } catch {
    return null;
  }
}

export function parseServicesJson(
  raw: string | undefined | null,
): CmsServiceCard[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .map((item, i) => normalizeService(item, i))
      .filter((s): s is CmsServiceCard => Boolean(s));
  } catch {
    return null;
  }
}

export function parseActivitiesJson(
  raw: string | undefined | null,
): CmsActivityCard[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .map((item, i) => normalizeActivity(item, i))
      .filter((s): s is CmsActivityCard => Boolean(s));
  } catch {
    return null;
  }
}

export function sectionValue(
  page: { sections?: Array<{ key: string; value: string }> } | null | undefined,
  key: string,
): string {
  return page?.sections?.find((s) => s.key === key)?.value || "";
}
