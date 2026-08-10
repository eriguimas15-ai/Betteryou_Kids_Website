/** Defaults CMS para páginas Sobre (jornada) e Serviços — alinhados ao site. */

export const SEED_JORNADA_ITEMS = [
  {
    id: 'jornada-1',
    year: '2021',
    title: 'Fundação',
    description:
      'Nascimento da Betteryou Kids com o sonho de revolucionar a educação infantil',
    icon: 'Sparkles',
    color: 'pink',
  },
  {
    id: 'jornada-2',
    year: '2021',
    title: 'Primeira Unidade',
    description: 'Abertura da primeira unidade com metodologia inovadora',
    icon: 'MapPin',
    color: 'blue',
  },
  {
    id: 'jornada-3',
    year: '2023',
    title: 'Expansão',
    description: 'Crescimento da comunidade e ampliação das actividades',
    icon: 'Users',
    color: 'green',
  },
  {
    id: 'jornada-4',
    year: '2024',
    title: 'Reconhecimento',
    description:
      'Considerada pelos pais como melhor instituição de educação infantil',
    icon: 'Trophy',
    color: 'accent',
  },
  {
    id: 'jornada-5',
    year: '2025',
    title: 'Abertura do Novo Espaço',
    description:
      'Inauguração do novo espaço da Betteryou Kids em 1 de Setembro de 2025, ampliando o atendimento e actividades.',
    icon: 'MapPin',
    color: 'blue',
  },
  {
    id: 'jornada-6',
    year: '2025',
    title: 'Segunda Unidade',
    description:
      'Abertura da segunda unidade após a mudança para o novo espaço, aumentando a capacidade de atendimento.',
    icon: 'MapPin',
    color: 'secondary',
  },
  {
    id: 'jornada-7',
    year: '2026',
    title: 'Abertura do 1º Ciclo',
    description:
      'Início das actividades do 1º Ciclo a partir de 14 de Setembro de 2026, com projecto pedagógico expandido.',
    icon: 'GraduationCap',
    color: 'secondary',
  },
];

export const SEED_SERVICE_CARDS = [
  {
    id: 'svc-1',
    title: 'Creche',
    ageRange: '1-3 anos',
    description:
      'Cuidados especializados para os primeiros anos, com foco no desenvolvimento motor, emocional e cognitivo.',
    features: [
      'Cuidados personalizados',
      'Desenvolvimento motor',
      'Primeiras interações sociais',
      'Alimentação saudável',
      'Ambiente seguro e acolhedor',
    ],
    icon: 'Baby',
    color: 'pink',
  },
  {
    id: 'svc-2',
    title: 'Pré-Escolar',
    ageRange: '3-5 anos',
    description:
      'Preparação para a vida escolar através de actividades lúdicas e educativas que estimulam a curiosidade.',
    features: [
      'Preparação escolar',
      'Actividades lúdicas',
      'Desenvolvimento da linguagem',
      'Coordenação motora',
      'Socialização',
    ],
    icon: 'Users',
    color: 'secondary',
  },
  {
    id: 'svc-3',
    title: 'Jardim de Infância',
    ageRange: '5-6 anos',
    description:
      'Transição suave para o ensino primário com actividades que desenvolvem a autonomia e responsabilidade.',
    features: [
      'Preparação para o primário',
      'Desenvolvimento da autonomia',
      'Iniciação à leitura e escrita',
      'Raciocínio lógico',
      'Responsabilidade social',
    ],
    icon: 'GraduationCap',
    color: 'green',
  },
  {
    id: 'svc-4',
    title: '1º Ciclo',
    ageRange: '6-10 anos',
    description:
      'Apoio educacional completo para o 1º Ciclo do Ensino Básico, com reforço escolar, actividades criativas e acompanhamento socioemocional.',
    features: [
      'Reforço escolar e trabalhos de casa',
      'Aulas de apoio em português, matemática e ciências',
      'Actividades lúdicas que fortalecem a autonomia',
      'Estímulo à leitura e expressão criativa',
      'Preparação para avaliações e organização do estudo',
      'Horários flexíveis adaptados às famílias',
    ],
    icon: 'GraduationCap',
    color: 'accent',
  },
  {
    id: 'svc-5',
    title: 'ATL',
    ageRange: '3-10 anos',
    description:
      'Actividades de tempos livres que complementam o ensino regular com diversão e aprendizagem.',
    features: [
      'Apoio aos trabalhos de casa',
      'Actividades recreativas',
      'Desenvolvimento de hobbies',
      'Convívio social',
      'Flexibilidade de horários',
    ],
    icon: 'Clock',
    color: 'purple',
  },
  {
    id: 'svc-6',
    title: 'Festas e Eventos Infantis',
    ageRange: '3-10 anos',
    description:
      'Transformamos cada celebração numa experiência única, com um espaço acolhedor, divertido e preparado para receber aniversários, baptizados, festas temáticas e outros eventos infantis.',
    features: [
      'Aluguer exclusivo do espaço',
      'Parque de estacionamento',
      'Ambiente seguro e confortável',
      'Apoio na organização do evento',
      'Festas de aniversário temáticas',
      'Área de brincadeiras e entretenimento',
      'Flexibilidade de horários',
      'Espaço amplo para família e convidados',
      'Pacotes adaptados às suas necessidades',
    ],
    icon: 'Gift',
    color: 'red',
  },
];

export const SEED_ACTIVITY_CARDS = [
  {
    id: 'act-1',
    title: 'Música',
    description:
      'Exploração musical com instrumentos, canto e movimento corporal para desenvolvimento rítmico e auditivo.',
    category: 'Artística',
    color: 'pink',
    icon: 'Music',
    imageUrl: '',
  },
  {
    id: 'act-2',
    title: 'Jiu-Jitsu',
    description:
      'Arte marcial que desenvolve disciplina, respeito, coordenação motora e autoconfiança.',
    category: 'Desportiva',
    color: 'blue',
    icon: 'Dumbbell',
    imageUrl: '',
  },
  {
    id: 'act-3',
    title: 'Ballet',
    description:
      'Dança clássica que promove graciosidade, equilíbrio, postura e expressão artística.',
    category: 'Artística',
    color: 'pink',
    icon: 'Palette',
    imageUrl: '',
  },
  {
    id: 'act-4',
    title: 'Actividades na Natureza',
    description:
      'Exploração do ambiente natural, jardinagem e consciência ecológica.',
    category: 'Natureza',
    color: 'green',
    icon: 'TreePine',
    imageUrl: '',
  },
  {
    id: 'act-5',
    title: 'Artes Plásticas',
    description:
      'Pintura, desenho, escultura e artesanato para estimular a criatividade e expressão.',
    category: 'Artística',
    color: 'accent',
    icon: 'Palette',
    imageUrl: '',
  },
  {
    id: 'act-6',
    title: 'A Magia das Histórias',
    description:
      'Desenvolvimento da linguagem, imaginação e amor pela leitura através de narrativas envolventes.',
    category: 'Educativa',
    color: 'secondary',
    icon: 'BookOpen',
    imageUrl: '',
  },
  {
    id: 'act-7',
    title: 'Culinária Infantil',
    description:
      'Introdução à culinária saudável, desenvolvendo coordenação motora e autonomia.',
    category: 'Prática',
    color: 'accent',
    icon: 'Utensils',
    imageUrl: '',
  },
  {
    id: 'act-8',
    title: 'Línguas Estrangeiras',
    description:
      'Introdução lúdica ao inglês e outras línguas através de jogos e músicas.',
    category: 'Educativa',
    color: 'blue',
    icon: 'Globe',
    imageUrl: '',
  },
];
