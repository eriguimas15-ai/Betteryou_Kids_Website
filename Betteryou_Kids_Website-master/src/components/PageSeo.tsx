import { Helmet } from "react-helmet-async";

export type PageSeoProps = {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
};

const SITE_NAME = "Betteryou Kids";
const DEFAULT_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "https://betteryoukids.com";

export function PageSeo({ title, description, path = "/", noindex = false }: PageSeoProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonical = `${DEFAULT_ORIGIN}${path === "/" ? "" : path}`;

  return (
    <Helmet>
      <html lang="pt" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
    </Helmet>
  );
}

/** Metadados das rotas públicas principais. */
export const PUBLIC_PAGE_SEO: Record<
  string,
  { title: string; description: string }
> = {
  "/": {
    title: "Betteryou Kids",
    description:
      "Educação infantil afectiva e inovadora: creche, pré-escolar e 1.º ciclo com amor, natureza e criatividade.",
  },
  "/sobre": {
    title: "Sobre nós",
    description:
      "Conheça a missão, a equipa e a pedagogia da Betteryou Kids — educação com afecto e excelência.",
  },
  "/servicos": {
    title: "Serviços",
    description:
      "Creche, pré-escolar e 1.º ciclo: modalidades educativas adaptadas a cada faixa etária.",
  },
  "/actividades": {
    title: "Actividades",
    description:
      "Actividades extracurriculares e experiências que estimulam a criatividade e o desenvolvimento.",
  },
  "/eventos": {
    title: "Eventos",
    description:
      "Festas, celebrações e eventos escolares da Betteryou Kids para famílias e comunidade.",
  },
  "/galeria": {
    title: "Galeria",
    description:
      "Momentos do dia-a-dia na Betteryou Kids: salas, natureza, criatividade e convivência.",
  },
  "/depoimentos": {
    title: "Depoimentos",
    description:
      "O que as famílias dizem sobre a experiência educativa na Betteryou Kids.",
  },
  "/contato": {
    title: "Contacto",
    description:
      "Contacte a Betteryou Kids para agendar uma visita ou esclarecer dúvidas sobre matrículas.",
  },
  "/plataforma": {
    title: "Plataforma escolar",
    description: "Acesso à plataforma escolar Betteryou Kids.",
  },
  "/inscricoes": {
    title: "Inscrições",
    description: "Candide-se a uma vaga na Betteryou Kids através da plataforma de inscrições.",
  },
  "/dashboard": {
    title: "Painel",
    description: "Painel de gestão da plataforma escolar Betteryou Kids.",
  },
};
