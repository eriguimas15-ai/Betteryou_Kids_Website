/** Tipos e helpers partilhados para slides/botões do hero no CMS. */

export type CmsHeroSlide = {
  id: string;
  line1: string;
  line2: string;
  line3: string;
  line1Color: string;
  line2Color: string;
  line3Color: string;
  description: string;
  descriptionColor: string;
  /** URL pública da imagem (opcional; vazio = imagem predefinida do slide). */
  imageUrl: string;
};

export type CmsHeroButton = {
  id: string;
  label: string;
  href: string;
  style: "primary" | "secondary";
};

export const HERO_LINE_COLOR_DEFAULTS = [
  "#1e293b",
  "#ea579a",
  "#50c878",
] as const;

export const DEFAULT_CMS_HERO_SLIDES: CmsHeroSlide[] = [
  {
    id: "slide-1",
    line1: "O amor guia,",
    line2: "a natureza inspira",
    line3: "e a criatividade transforma",
    line1Color: HERO_LINE_COLOR_DEFAULTS[0],
    line2Color: HERO_LINE_COLOR_DEFAULTS[1],
    line3Color: HERO_LINE_COLOR_DEFAULTS[2],
    description:
      "Na Betteryou Kids, proporcionamos uma educação afectiva e inovadora que prepara seus filhos para um futuro brilhante através de metodologias únicas baseadas no amor, conexão com a natureza e estímulo à criatividade.",
    descriptionColor: "",
    imageUrl: "",
  },
  {
    id: "slide-2",
    line1: "Explorando juntos",
    line2: "o mundo natural",
    line3: "com curiosidade e alegria",
    line1Color: "#166534",
    line2Color: "#22c55e",
    line3Color: "#38bdf8",
    description:
      "Oferecemos experiências únicas de aprendizagem ao ar livre, onde cada criança descobre seu potencial através da conexão profunda com a natureza e actividades que estimulam todos os sentidos.",
    descriptionColor: "",
    imageUrl: "",
  },
  {
    id: "slide-3",
    line1: "Desenvolvendo talentos",
    line2: "através da arte",
    line3: "e expressão criativa",
    line1Color: "#6b21a8",
    line2Color: "#a855f7",
    line3Color: "#fb923c",
    description:
      "Nossas actividades artísticas e culturais permitem que cada criança explore sua criatividade única, desenvolvendo habilidades essenciais para a vida através de música, dança, arte e muito mais.",
    descriptionColor: "",
    imageUrl: "",
  },
];

export const DEFAULT_CMS_HERO_BUTTONS: CmsHeroButton[] = [
  {
    id: "btn-1",
    label: "Agendar Visita",
    href: "/contato",
    style: "primary",
  },
  {
    id: "btn-2",
    label: "Conhecer Serviços",
    href: "/servicos",
    style: "secondary",
  },
];

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyHeroSlide(): CmsHeroSlide {
  return {
    id: newId("slide"),
    line1: "",
    line2: "",
    line3: "",
    line1Color: HERO_LINE_COLOR_DEFAULTS[0],
    line2Color: HERO_LINE_COLOR_DEFAULTS[1],
    line3Color: HERO_LINE_COLOR_DEFAULTS[2],
    description: "",
    descriptionColor: "",
    imageUrl: "",
  };
}

export function createEmptyHeroButton(): CmsHeroButton {
  return {
    id: newId("btn"),
    label: "Novo botão",
    href: "/",
    style: "secondary",
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeSlide(raw: unknown, index: number): CmsHeroSlide | null {
  const o = asObject(raw);
  if (!o) return null;
  const fallback = DEFAULT_CMS_HERO_SLIDES[index % DEFAULT_CMS_HERO_SLIDES.length];
  return {
    id: String(o.id || `slide-${index + 1}`),
    line1: String(o.line1 ?? ""),
    line2: String(o.line2 ?? ""),
    line3: String(o.line3 ?? ""),
    line1Color: String(o.line1Color ?? fallback.line1Color),
    line2Color: String(o.line2Color ?? fallback.line2Color),
    line3Color: String(o.line3Color ?? fallback.line3Color),
    description: String(o.description ?? ""),
    descriptionColor: String(o.descriptionColor ?? ""),
    imageUrl: String(o.imageUrl ?? ""),
  };
}

function normalizeButton(raw: unknown, index: number): CmsHeroButton | null {
  const o = asObject(raw);
  if (!o) return null;
  const style = o.style === "primary" ? "primary" : "secondary";
  return {
    id: String(o.id || `btn-${index + 1}`),
    label: String(o.label ?? "").trim() || `Botão ${index + 1}`,
    href: String(o.href ?? "/").trim() || "/",
    style,
  };
}

export function parseHeroSlidesJson(raw: string | undefined | null): CmsHeroSlide[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .map((item, i) => normalizeSlide(item, i))
      .filter((s): s is CmsHeroSlide => Boolean(s));
  } catch {
    return null;
  }
}

export function parseHeroButtonsJson(
  raw: string | undefined | null,
): CmsHeroButton[] | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .map((item, i) => normalizeButton(item, i))
      .filter((b): b is CmsHeroButton => Boolean(b));
  } catch {
    return null;
  }
}

/** Constrói slides a partir do formato legado (só 1.º slide no CMS). */
export function slidesFromLegacyFields(fields: {
  line1: string;
  line2: string;
  line3: string;
  line1Color: string;
  line2Color: string;
  line3Color: string;
  description: string;
  descriptionColor: string;
}): CmsHeroSlide[] {
  const first: CmsHeroSlide = {
    ...DEFAULT_CMS_HERO_SLIDES[0],
    line1: fields.line1 || DEFAULT_CMS_HERO_SLIDES[0].line1,
    line2: fields.line2 || DEFAULT_CMS_HERO_SLIDES[0].line2,
    line3: fields.line3 || DEFAULT_CMS_HERO_SLIDES[0].line3,
    line1Color: fields.line1Color || DEFAULT_CMS_HERO_SLIDES[0].line1Color,
    line2Color: fields.line2Color || DEFAULT_CMS_HERO_SLIDES[0].line2Color,
    line3Color: fields.line3Color || DEFAULT_CMS_HERO_SLIDES[0].line3Color,
    description: fields.description || DEFAULT_CMS_HERO_SLIDES[0].description,
    descriptionColor: fields.descriptionColor,
  };
  return [first, { ...DEFAULT_CMS_HERO_SLIDES[1] }, { ...DEFAULT_CMS_HERO_SLIDES[2] }];
}

export function buttonsFromLegacyCta(cta: string): CmsHeroButton[] {
  const primaryLabel = cta.trim() || DEFAULT_CMS_HERO_BUTTONS[0].label;
  return [
    { ...DEFAULT_CMS_HERO_BUTTONS[0], label: primaryLabel },
    { ...DEFAULT_CMS_HERO_BUTTONS[1] },
  ];
}
