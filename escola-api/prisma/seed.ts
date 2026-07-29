import {
  PrismaClient,
  Role,
  ContentStatus,
  JobStatus,
  EventType,
  FeeKind,
  FeeProgram,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type RoomSeed = {
  name: string;
  unitId: string;
  serviceId: string;
  capacity: number;
  levelLabel?: string;
  ageLabel?: string;
  minAgeYears?: number;
  maxAgeYears?: number;
  enrolledCount?: number;
  renewalReserved?: number;
};

async function upsertRoom(yearId: string, room: RoomSeed) {
  await prisma.room.upsert({
    where: {
      name_unitId_academicYearId: {
        name: room.name,
        unitId: room.unitId,
        academicYearId: yearId,
      },
    },
    update: {
      capacity: room.capacity,
      serviceId: room.serviceId,
      levelLabel: room.levelLabel ?? null,
      ageLabel: room.ageLabel ?? null,
      minAgeYears: room.minAgeYears ?? null,
      maxAgeYears: room.maxAgeYears ?? null,
      enrolledCount: room.enrolledCount ?? 0,
      renewalReserved: room.renewalReserved ?? 0,
      active: true,
    },
    create: {
      name: room.name,
      unitId: room.unitId,
      serviceId: room.serviceId,
      academicYearId: yearId,
      capacity: room.capacity,
      levelLabel: room.levelLabel,
      ageLabel: room.ageLabel,
      minAgeYears: room.minAgeYears,
      maxAgeYears: room.maxAgeYears,
      enrolledCount: room.enrolledCount ?? 0,
      renewalReserved: room.renewalReserved ?? 0,
      active: true,
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  // Migrar domínio antigo (@betteryou.ao → @betteryoukids.com)
  await prisma.user.updateMany({
    where: { email: 'admin@betteryou.ao' },
    data: { email: 'admin@betteryoukids.com' },
  });
  await prisma.user.updateMany({
    where: { email: 'comunicacao@betteryou.ao' },
    data: { email: 'comunicacao@betteryoukids.com' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@betteryoukids.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@betteryoukids.com',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'comunicacao@betteryoukids.com' },
    update: {},
    create: {
      name: 'Equipa Comunicação',
      email: 'comunicacao@betteryoukids.com',
      passwordHash: await bcrypt.hash('Comunica123!', 12),
      role: Role.COMUNICACAO,
    },
  });

  const profileDefs: Array<{
    systemKey: string;
    name: string;
    modules: string[];
  }> = [
    {
      systemKey: 'ADMIN',
      name: 'Administrador',
      modules: [
        'dashboard',
        'painel',
        'portal',
        'inscricoes',
        'renovacoes',
        'ficha',
        'espera',
        'salas',
        'turmas',
        'presencas',
        'academico',
        'curriculo',
        'nee',
        'comunicados',
        'eventos',
        'financeiro',
        'relatorios',
        'actividades',
        'emprego',
        'conteudo',
        'unidades',
        'auditoria',
        'backups',
        'acessos',
      ],
    },
    {
      systemKey: 'DIRECAO',
      name: 'Direcção',
      modules: [
        'dashboard',
        'painel',
        'portal',
        'inscricoes',
        'renovacoes',
        'ficha',
        'espera',
        'salas',
        'turmas',
        'presencas',
        'academico',
        'curriculo',
        'nee',
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
    },
    {
      systemKey: 'COMUNICACAO',
      name: 'Comunicação',
      modules: [
        'inscricoes',
        'comunicados',
        'eventos',
        'emprego',
        'conteudo',
      ],
    },
    {
      systemKey: 'COORDENACAO',
      name: 'Coordenação',
      modules: [
        'dashboard',
        'portal',
        'inscricoes',
        'renovacoes',
        'ficha',
        'espera',
        'salas',
        'turmas',
        'presencas',
        'academico',
        'curriculo',
        'nee',
        'comunicados',
        'eventos',
        'actividades',
        'relatorios',
      ],
    },
    {
      systemKey: 'PROFESSOR',
      name: 'Professor(a)',
      modules: [
        'dashboard',
        'presencas',
        'academico',
        'curriculo',
        'nee',
        'comunicados',
      ],
    },
    {
      systemKey: 'ENCARREGADO',
      name: 'Encarregado de educação',
      modules: ['portal', 'inscricoes', 'renovacoes', 'ficha'],
    },
  ];

  for (const def of profileDefs) {
    await prisma.accessProfile.upsert({
      where: { systemKey: def.systemKey },
      update: { modules: def.modules, name: def.name, active: true },
      create: {
        name: def.name,
        systemKey: def.systemKey,
        description: `Perfil padrão ${def.name}`,
        modules: def.modules,
      },
    });
  }

  const adminProfile = await prisma.accessProfile.findUnique({
    where: { systemKey: 'ADMIN' },
  });
  const comProfile = await prisma.accessProfile.findUnique({
    where: { systemKey: 'COMUNICACAO' },
  });
  const direcaoProfile = await prisma.accessProfile.findUnique({
    where: { systemKey: 'DIRECAO' },
  });
  const coordenacaoProfile = await prisma.accessProfile.findUnique({
    where: { systemKey: 'COORDENACAO' },
  });
  const encarregadoProfile = await prisma.accessProfile.findUnique({
    where: { systemKey: 'ENCARREGADO' },
  });
  if (adminProfile) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { accessProfileId: adminProfile.id },
    });
  }
  if (comProfile) {
    await prisma.user.updateMany({
      where: { email: 'comunicacao@betteryoukids.com' },
      data: { accessProfileId: comProfile.id },
    });
  }

  // Contas de teste (upsert não destrutivo; passwords conhecidas para smoke)
  const direcaoHash = await bcrypt.hash('Direcao123!', 12);
  await prisma.user.upsert({
    where: { email: 'direcao@betteryoukids.com' },
    update: {
      passwordHash: direcaoHash,
      role: Role.DIRECAO,
      accessProfileId: direcaoProfile?.id ?? null,
      name: 'Direcção (teste)',
    },
    create: {
      name: 'Direcção (teste)',
      email: 'direcao@betteryoukids.com',
      passwordHash: direcaoHash,
      role: Role.DIRECAO,
      accessProfileId: direcaoProfile?.id ?? null,
    },
  });

  const coordHash = await bcrypt.hash('Coordena123!', 12);
  await prisma.user.upsert({
    where: { email: 'coordenacao@betteryoukids.com' },
    update: {
      passwordHash: coordHash,
      role: Role.COORDENACAO,
      accessProfileId: coordenacaoProfile?.id ?? null,
      name: 'Coordenação (teste)',
    },
    create: {
      name: 'Coordenação (teste)',
      email: 'coordenacao@betteryoukids.com',
      passwordHash: coordHash,
      role: Role.COORDENACAO,
      accessProfileId: coordenacaoProfile?.id ?? null,
    },
  });

  const encHash = await bcrypt.hash('Encarrega123!', 12);
  await prisma.user.upsert({
    where: { email: 'encarregado@betteryoukids.com' },
    update: {
      passwordHash: encHash,
      role: Role.ENCARREGADO,
      accessProfileId: encarregadoProfile?.id ?? null,
      name: 'Encarregado (teste)',
    },
    create: {
      name: 'Encarregado (teste)',
      email: 'encarregado@betteryoukids.com',
      passwordHash: encHash,
      role: Role.ENCARREGADO,
      accessProfileId: encarregadoProfile?.id ?? null,
    },
  });

  await prisma.jobOpening.upsert({
    where: { id: 'seed-job-educador' },
    update: {
      title: 'Educador(a) de Infância',
      status: JobStatus.PUBLICADA,
      publishedAt: new Date(),
    },
    create: {
      id: 'seed-job-educador',
      title: 'Educador(a) de Infância',
      department: 'Pedagogia',
      location: 'Luanda — Unidade Gika',
      description:
        'Procuramos educador(a) motivado(a) para integrar a equipa BetterYou Kids, com foco no desenvolvimento integral das crianças.',
      requirements:
        'Formação em Educação de Infância; experiência mínima de 1 ano; gosto por trabalhar em equipa.',
      status: JobStatus.PUBLICADA,
      publishedAt: new Date(),
    },
  });

  const year = await prisma.academicYear.upsert({
    where: { label: '2026/2027' },
    update: { active: true },
    create: { label: '2026/2027', active: true },
  });

  // Unidade canónica: Sagrada Família (legado "Gika").
  const legacyGika = await prisma.unit.findUnique({ where: { name: 'Gika' } });
  if (legacyGika) {
    await prisma.unit.update({
      where: { id: legacyGika.id },
      data: {
        name: 'Sagrada Família',
        address: 'Av. Cmte. Gika 150, Sagrada Família, Luanda',
        active: true,
      },
    });
  }

  const gika = await prisma.unit.upsert({
    where: { name: 'Sagrada Família' },
    update: {
      address: 'Av. Cmte. Gika 150, Sagrada Família, Luanda',
      active: true,
    },
    create: {
      name: 'Sagrada Família',
      address: 'Av. Cmte. Gika 150, Sagrada Família, Luanda',
    },
  });

  const patriota = await prisma.unit.upsert({
    where: { name: 'Patriota' },
    update: {
      address: 'Rua Urbanização Harmonia, Patriota',
      active: true,
    },
    create: {
      name: 'Patriota',
      address: 'Rua Urbanização Harmonia, Patriota',
    },
  });

  const serviceNames = [
    'Creche',
    'Pré-Escolar',
    'Jardim de Infância',
    '1.º Ciclo',
    'ATL',
    'Festas e Eventos Infantis',
  ];

  const services: Record<string, string> = {};
  for (const name of serviceNames) {
    const service = await prisma.serviceOffering.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    services[name] = service.id;
  }

  const gikaServices = [
    'Creche',
    'Pré-Escolar',
    'Jardim de Infância',
    '1.º Ciclo',
    'ATL',
    'Festas e Eventos Infantis',
  ];
  const patriotaServices = [
    'Creche',
    'Pré-Escolar',
    'Jardim de Infância',
    'ATL',
  ];

  for (const name of gikaServices) {
    await prisma.unitService.upsert({
      where: {
        unitId_serviceId: { unitId: gika.id, serviceId: services[name] },
      },
      update: { active: true },
      create: { unitId: gika.id, serviceId: services[name], active: true },
    });
  }

  for (const name of patriotaServices) {
    await prisma.unitService.upsert({
      where: {
        unitId_serviceId: {
          unitId: patriota.id,
          serviceId: services[name],
        },
      },
      update: { active: true },
      create: {
        unitId: patriota.id,
        serviceId: services[name],
        active: true,
      },
    });
  }

  // Desactivar salas antigas de exemplo
  await prisma.room.updateMany({
    where: {
      name: {
        in: ['Sala Girassol', 'Sala Borboleta', 'Sala Arco-Íris', 'Sala Sementinha'],
      },
    },
    data: { active: false },
  });

  const roomDefs: RoomSeed[] = [
    // Creche — Gika & Patriota
    {
      name: 'Círculo',
      unitId: gika.id,
      serviceId: services['Creche'],
      capacity: 12,
      ageLabel: '1 a 2 anos',
      minAgeYears: 1,
      maxAgeYears: 2,
      enrolledCount: 10,
    },
    {
      name: 'Triângulo',
      unitId: gika.id,
      serviceId: services['Creche'],
      capacity: 14,
      ageLabel: '2 a 3 anos',
      minAgeYears: 2,
      maxAgeYears: 3,
      enrolledCount: 12,
    },
    {
      name: 'Quadrado',
      unitId: gika.id,
      serviceId: services['Creche'],
      capacity: 16,
      ageLabel: '3 a 4 anos',
      minAgeYears: 3,
      maxAgeYears: 4,
      enrolledCount: 14,
    },
    {
      name: 'Círculo',
      unitId: patriota.id,
      serviceId: services['Creche'],
      capacity: 12,
      ageLabel: '1 a 2 anos',
      minAgeYears: 1,
      maxAgeYears: 2,
      enrolledCount: 11,
    },
    {
      name: 'Triângulo',
      unitId: patriota.id,
      serviceId: services['Creche'],
      capacity: 14,
      ageLabel: '2 a 3 anos',
      minAgeYears: 2,
      maxAgeYears: 3,
      enrolledCount: 14,
    },
    {
      name: 'Quadrado',
      unitId: patriota.id,
      serviceId: services['Creche'],
      capacity: 16,
      ageLabel: '3 a 4 anos',
      minAgeYears: 3,
      maxAgeYears: 4,
      enrolledCount: 15,
    },
    // Pré-Escolar
    {
      name: 'Pentágono',
      unitId: gika.id,
      serviceId: services['Pré-Escolar'],
      capacity: 20,
      ageLabel: '4 a 5 anos',
      minAgeYears: 4,
      maxAgeYears: 5,
      enrolledCount: 18,
    },
    {
      name: 'Estrela',
      unitId: gika.id,
      serviceId: services['Pré-Escolar'],
      capacity: 20,
      ageLabel: '5 a 6 anos',
      minAgeYears: 5,
      maxAgeYears: 6,
      enrolledCount: 19,
    },
    {
      name: 'Pentágono',
      unitId: patriota.id,
      serviceId: services['Pré-Escolar'],
      capacity: 18,
      ageLabel: '4 a 5 anos',
      minAgeYears: 4,
      maxAgeYears: 5,
      enrolledCount: 18,
    },
    {
      name: 'Estrela',
      unitId: patriota.id,
      serviceId: services['Pré-Escolar'],
      capacity: 18,
      ageLabel: '5 a 6 anos',
      minAgeYears: 5,
      maxAgeYears: 6,
      enrolledCount: 16,
    },
    // ATL
    {
      name: 'Hexágono',
      unitId: gika.id,
      serviceId: services['ATL'],
      capacity: 24,
      ageLabel: 'ATL',
      minAgeYears: 6,
      maxAgeYears: 12,
      enrolledCount: 20,
      renewalReserved: 2,
    },
    {
      name: 'Hexágono',
      unitId: patriota.id,
      serviceId: services['ATL'],
      capacity: 24,
      ageLabel: 'ATL',
      minAgeYears: 6,
      maxAgeYears: 12,
      enrolledCount: 19,
    },
    // 1.º Ciclo — Gika (classes + salas nomeadas)
    {
      name: 'Sala Girassol A',
      unitId: gika.id,
      serviceId: services['1.º Ciclo'],
      capacity: 22,
      levelLabel: '1.ª Classe',
      ageLabel: '6 a 7 anos',
      minAgeYears: 6,
      maxAgeYears: 7,
      enrolledCount: 20,
    },
    {
      name: 'Sala Girassol B',
      unitId: gika.id,
      serviceId: services['1.º Ciclo'],
      capacity: 22,
      levelLabel: '1.ª Classe',
      ageLabel: '6 a 7 anos',
      minAgeYears: 6,
      maxAgeYears: 7,
      enrolledCount: 22,
    },
    {
      name: 'Sala Tulipa',
      unitId: gika.id,
      serviceId: services['1.º Ciclo'],
      capacity: 22,
      levelLabel: '2.ª Classe',
      ageLabel: '7 a 8 anos',
      minAgeYears: 7,
      maxAgeYears: 8,
      enrolledCount: 18,
    },
    {
      name: 'Sala Orquídea',
      unitId: gika.id,
      serviceId: services['1.º Ciclo'],
      capacity: 22,
      levelLabel: '3.ª Classe',
      ageLabel: '8 a 9 anos',
      minAgeYears: 8,
      maxAgeYears: 9,
      enrolledCount: 17,
    },
    {
      name: 'Sala Magnólia',
      unitId: gika.id,
      serviceId: services['1.º Ciclo'],
      capacity: 22,
      levelLabel: '4.ª Classe',
      ageLabel: '9 a 10 anos',
      minAgeYears: 9,
      maxAgeYears: 10,
      enrolledCount: 16,
    },
    // Jardim de Infância (exemplo)
    {
      name: 'Arco-Íris',
      unitId: gika.id,
      serviceId: services['Jardim de Infância'],
      capacity: 18,
      ageLabel: '3 a 5 anos',
      minAgeYears: 3,
      maxAgeYears: 5,
      enrolledCount: 15,
    },
    {
      name: 'Arco-Íris',
      unitId: patriota.id,
      serviceId: services['Jardim de Infância'],
      capacity: 18,
      ageLabel: '3 a 5 anos',
      minAgeYears: 3,
      maxAgeYears: 5,
      enrolledCount: 18,
    },
  ];

  for (const room of roomDefs) {
    await upsertRoom(year.id, room);
  }

  await prisma.contentPage.upsert({
    where: { slug: 'home' },
    update: {
      status: ContentStatus.PUBLICADO,
      publishedAt: new Date(),
      title: 'Home',
    },
    create: {
      slug: 'home',
      title: 'Home',
      status: ContentStatus.PUBLICADO,
      authorId: admin.id,
      publishedAt: new Date(),
      sections: {
        create: [
          {
            key: 'hero_title',
            label: 'Título principal',
            value: 'BetterYou Kids',
            sortOrder: 0,
          },
          {
            key: 'hero_subtitle',
            label: 'Subtítulo',
            value: 'Cuidar, educar e inspirar cada criança.',
            sortOrder: 1,
          },
          {
            key: 'cta_primary',
            label: 'Botão principal',
            value: 'Inscrever agora',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  const homePage = await prisma.contentPage.findUnique({
    where: { slug: 'home' },
  });
  if (homePage) {
    const homeSections = [
      {
        key: 'hero_title',
        label: 'Título principal',
        value: 'BetterYou Kids',
        sortOrder: 0,
      },
      {
        key: 'hero_subtitle',
        label: 'Subtítulo',
        value: 'Cuidar, educar e inspirar cada criança.',
        sortOrder: 1,
      },
      {
        key: 'cta_primary',
        label: 'Botão principal',
        value: 'Inscrever agora',
        sortOrder: 2,
      },
    ];
    for (const section of homeSections) {
      await prisma.contentSection.upsert({
        where: {
          pageId_key: { pageId: homePage.id, key: section.key },
        },
        update: {
          label: section.label,
          value: section.value,
          sortOrder: section.sortOrder,
        },
        create: {
          pageId: homePage.id,
          ...section,
        },
      });
    }
  }

  await prisma.testimonial.deleteMany({
    where: { authorName: { in: ['Maria Silva', 'Carlos Mendes'] } },
  });
  await prisma.testimonial.createMany({
    data: [
      {
        authorName: 'Maria Silva',
        text: 'A BetterYou Kids transformou a vida do meu filho. Aprende brincando e chega sempre a casa feliz!',
        unitName: 'Sagrada Família',
        featured: true,
        status: ContentStatus.PUBLICADO,
        sortOrder: 1,
      },
      {
        authorName: 'Carlos Mendes',
        text: 'Excelente metodologia. A nossa filha desenvolveu muito a criatividade e as competências sociais.',
        unitName: 'Patriota',
        featured: true,
        status: ContentStatus.PUBLICADO,
        sortOrder: 2,
      },
    ],
  });

  // Álbuns de galeria (categorias) — criados como rascunho para a Comunicação
  // preencher com imagens. O site público mantém o fallback até publicarem.
  const galleryAlbums = [
    { title: 'Instalações', slug: 'instalacoes', sortOrder: 1 },
    { title: 'Actividades', slug: 'actividades', sortOrder: 2 },
    { title: 'Eventos', slug: 'eventos', sortOrder: 3 },
  ];
  for (const album of galleryAlbums) {
    await prisma.galleryAlbum.upsert({
      where: { slug: album.slug },
      update: { title: album.title, sortOrder: album.sortOrder },
      create: {
        title: album.title,
        slug: album.slug,
        sortOrder: album.sortOrder,
        status: ContentStatus.RASCUNHO,
      },
    });
  }

  const activities = [
    { name: 'Ginástica', category: 'Desportiva', sortOrder: 1 },
    { name: 'Inglês', category: 'Educativa', sortOrder: 2 },
    { name: 'Música', category: 'Artística', sortOrder: 3 },
    { name: 'Jiu-Jitsu', category: 'Desportiva', sortOrder: 4 },
    { name: 'Ballet', category: 'Artística', sortOrder: 5 },
    { name: 'Xadrez', category: 'Educativa', sortOrder: 6 },
    { name: 'Dança Criativa', category: 'Artística', sortOrder: 7 },
    { name: 'Artes', category: 'Artística', sortOrder: 8 },
    { name: 'Natação', category: 'Desportiva', sortOrder: 9 },
  ];

  const deprecatedActivities = [
    'Actividades na Natureza',
    'Artes Plásticas',
    'A Magia das Histórias',
    'Culinária Infantil',
    'Línguas Estrangeiras',
  ];

  for (const name of deprecatedActivities) {
    await prisma.activityOffering.updateMany({
      where: { name },
      data: { active: false },
    });
  }

  const activityIds: Record<string, string> = {};
  for (const activity of activities) {
    const row = await prisma.activityOffering.upsert({
      where: { name: activity.name },
      update: {
        category: activity.category,
        sortOrder: activity.sortOrder,
        active: true,
      },
      create: {
        name: activity.name,
        category: activity.category,
        sortOrder: activity.sortOrder,
        active: true,
      },
    });
    activityIds[activity.name] = row.id;
  }

  type PricingKind = 'INCLUDED' | 'PAID';
  // unit: undefined = global (fallback para todas as unidades); 'Gika' | 'Patriota' = específico.
  const serviceActivityMatrix: Array<{
    activity: string;
    service: string;
    pricing: PricingKind;
    priceAkz?: number;
    unit?: 'Gika' | 'Patriota';
  }> = [
    // Incluídas (Ginástica/Inglês/Música) — globais: iguais em todas as unidades.
    { activity: 'Ginástica', service: 'Creche', pricing: 'INCLUDED' },
    { activity: 'Inglês', service: 'Creche', pricing: 'INCLUDED' },
    { activity: 'Música', service: 'Creche', pricing: 'INCLUDED' },
    { activity: 'Ginástica', service: 'Pré-Escolar', pricing: 'INCLUDED' },
    { activity: 'Inglês', service: 'Pré-Escolar', pricing: 'INCLUDED' },
    { activity: 'Música', service: 'Pré-Escolar', pricing: 'INCLUDED' },
    { activity: 'Ginástica', service: 'ATL', pricing: 'INCLUDED' },
    { activity: 'Inglês', service: 'ATL', pricing: 'INCLUDED' },
    { activity: 'Música', service: 'ATL', pricing: 'INCLUDED' },

    // ── Sagrada Família (Gika) — opcionais pagas ──
    { activity: 'Dança Criativa', service: 'Creche', pricing: 'PAID', priceAkz: 40000, unit: 'Gika' },
    { activity: 'Jiu-Jitsu', service: 'Pré-Escolar', pricing: 'PAID', priceAkz: 40000, unit: 'Gika' },
    { activity: 'Ballet', service: 'Pré-Escolar', pricing: 'PAID', priceAkz: 40000, unit: 'Gika' },
    { activity: 'Xadrez', service: 'Pré-Escolar', pricing: 'PAID', priceAkz: 30000, unit: 'Gika' },
    { activity: 'Jiu-Jitsu', service: 'ATL', pricing: 'PAID', priceAkz: 40000, unit: 'Gika' },
    { activity: 'Ballet', service: 'ATL', pricing: 'PAID', priceAkz: 40000, unit: 'Gika' },
    { activity: 'Xadrez', service: 'ATL', pricing: 'PAID', priceAkz: 30000, unit: 'Gika' },

    // ── Patriota (Alfa Kids) — opcionais pagas + Natação ──
    { activity: 'Dança Criativa', service: 'Creche', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },
    { activity: 'Natação', service: 'Creche', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },
    { activity: 'Jiu-Jitsu', service: 'Pré-Escolar', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },
    { activity: 'Ballet', service: 'Pré-Escolar', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },
    { activity: 'Xadrez', service: 'Pré-Escolar', pricing: 'PAID', priceAkz: 25000, unit: 'Patriota' },
    { activity: 'Natação', service: 'Pré-Escolar', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },
    { activity: 'Jiu-Jitsu', service: 'ATL', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },
    { activity: 'Ballet', service: 'ATL', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },
    { activity: 'Xadrez', service: 'ATL', pricing: 'PAID', priceAkz: 25000, unit: 'Patriota' },
    { activity: 'Natação', service: 'ATL', pricing: 'PAID', priceAkz: 30000, unit: 'Patriota' },

    // 1.º Ciclo — extracurriculares opcionais (global; valores comuns)
    { activity: 'Jiu-Jitsu', service: '1.º Ciclo', pricing: 'PAID', priceAkz: 40000 },
    { activity: 'Ballet', service: '1.º Ciclo', pricing: 'PAID', priceAkz: 40000 },
    { activity: 'Xadrez', service: '1.º Ciclo', pricing: 'PAID', priceAkz: 30000 },
    { activity: 'Artes', service: '1.º Ciclo', pricing: 'PAID', priceAkz: 45000 },
  ];

  const activityUnitIds: Record<'Gika' | 'Patriota', string> = {
    Gika: gika.id,
    Patriota: patriota.id,
  };

  await prisma.activityServiceOffering.deleteMany({});
  for (const row of serviceActivityMatrix) {
    const activityId = activityIds[row.activity];
    const serviceId = services[row.service];
    if (!activityId || !serviceId) continue;
    await prisma.activityServiceOffering.create({
      data: {
        unitId: row.unit ? activityUnitIds[row.unit] : null,
        activityId,
        serviceId,
        pricing: row.pricing,
        priceAkz: row.pricing === 'PAID' ? (row.priceAkz ?? null) : null,
        active: true,
      },
    });
  }

  // Eventos / festas de exemplo (um publicado, um rascunho)
  const eventSeeds = [
    {
      id: 'seed-event-festa-verao',
      title: 'Festa de Verão BetterYou Kids',
      description:
        'Uma tarde de jogos, música e diversão para toda a família. Insufláveis, pinturas faciais e lanche partilhado. Traga a sua criança!',
      type: EventType.FESTA,
      status: ContentStatus.PUBLICADO,
      startAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      location: 'Unidade Gika — Pátio exterior',
      unitId: gika.id,
      capacity: 80,
      priceAkz: 0,
      publishedAt: new Date(),
    },
    {
      id: 'seed-event-workshop-pais',
      title: 'Workshop para Pais: Rotinas Positivas',
      description:
        'Sessão prática sobre rotinas e disciplina positiva, orientada pela nossa equipa pedagógica.',
      type: EventType.WORKSHOP,
      status: ContentStatus.RASCUNHO,
      startAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      location: 'Unidade Gika — Sala polivalente',
      unitId: gika.id,
      capacity: 30,
      priceAkz: null,
      publishedAt: null,
    },
  ];

  for (const ev of eventSeeds) {
    await prisma.event.upsert({
      where: { id: ev.id },
      update: {
        title: ev.title,
        description: ev.description,
        type: ev.type,
        status: ev.status,
        startAt: ev.startAt,
        location: ev.location,
        unitId: ev.unitId,
        capacity: ev.capacity,
        priceAkz: ev.priceAkz,
        publishedAt: ev.publishedAt,
      },
      create: {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        type: ev.type,
        status: ev.status,
        startAt: ev.startAt,
        location: ev.location,
        unitId: ev.unitId,
        capacity: ev.capacity,
        priceAkz: ev.priceAkz,
        authorId: admin.id,
        publishedAt: ev.publishedAt,
      },
    });
  }

  // ─────────────── Financeiro: preçário real BY Kids 2026/2027 ───────────────
  // Fonte: «BY Kids - Serviços e Preços 2026-2027» e «Condições Financeiras
  // 1.º Ciclo 2026-27». Valores em AKZ (Kwanza).
  type FeePlanSeed = {
    id: string;
    name: string;
    kind: FeeKind;
    /** Nome da unidade (Gika = Sagrada Família, Patriota). undefined = Gika. */
    unit?: string | null;
    service: string | null;
    program: FeeProgram | null;
    amountAkz: number;
    description?: string;
  };

  const feePlanSeeds: FeePlanSeed[] = [
    // Propinas mensais — Creche
    {
      id: 'seed-feeplan-creche-meio',
      name: 'Creche — Meio tempo (sem alimentação)',
      kind: FeeKind.PROPINA,
      service: 'Creche',
      program: FeeProgram.MEIO_TEMPO,
      amountAkz: 235000,
      description: '3h/dia, sem refeições.',
    },
    {
      id: 'seed-feeplan-creche-meio-alim',
      name: 'Creche — Meio tempo (com alimentação)',
      kind: FeeKind.PROPINA,
      service: 'Creche',
      program: FeeProgram.MEIO_TEMPO_ALIMENTACAO,
      amountAkz: 255000,
      description: 'Inclui 2 refeições diárias.',
    },
    {
      id: 'seed-feeplan-creche-inteiro',
      name: 'Creche — Tempo inteiro',
      kind: FeeKind.PROPINA,
      service: 'Creche',
      program: FeeProgram.TEMPO_INTEIRO,
      amountAkz: 295000,
      description: 'Inclui 3 refeições diárias.',
    },
    // Propinas mensais — Pré-Escolar
    {
      id: 'seed-feeplan-pre-meio',
      name: 'Pré-Escolar — Meio tempo (sem alimentação)',
      kind: FeeKind.PROPINA,
      service: 'Pré-Escolar',
      program: FeeProgram.MEIO_TEMPO,
      amountAkz: 235000,
      description: '3h/dia, sem refeições.',
    },
    {
      id: 'seed-feeplan-pre-meio-alim',
      name: 'Pré-Escolar — Meio tempo (com alimentação)',
      kind: FeeKind.PROPINA,
      service: 'Pré-Escolar',
      program: FeeProgram.MEIO_TEMPO_ALIMENTACAO,
      amountAkz: 235000,
      description: 'Inclui 2 refeições diárias.',
    },
    {
      id: 'seed-feeplan-pre-inteiro',
      name: 'Pré-Escolar — Tempo inteiro',
      kind: FeeKind.PROPINA,
      service: 'Pré-Escolar',
      program: FeeProgram.TEMPO_INTEIRO,
      amountAkz: 280000,
      description: 'Inclui 3 refeições diárias.',
    },
    // Propinas mensais — ATL
    {
      id: 'seed-feeplan-atl-meio',
      name: 'ATL — Meio tempo (sem alimentação)',
      kind: FeeKind.PROPINA,
      service: 'ATL',
      program: FeeProgram.MEIO_TEMPO,
      amountAkz: 235000,
      description: '3h/dia, sem refeições.',
    },
    {
      id: 'seed-feeplan-atl-meio-alim',
      name: 'ATL — Meio tempo (com alimentação)',
      kind: FeeKind.PROPINA,
      service: 'ATL',
      program: FeeProgram.MEIO_TEMPO_ALIMENTACAO,
      amountAkz: 280000,
      description: 'Inclui 2 refeições diárias.',
    },
    {
      id: 'seed-feeplan-atl-inteiro',
      name: 'ATL — Tempo inteiro',
      kind: FeeKind.PROPINA,
      service: 'ATL',
      program: FeeProgram.TEMPO_INTEIRO,
      amountAkz: 280000,
      description: 'Inclui 3 refeições diárias.',
    },
    // Propinas mensais — 1.º Ciclo (1.º Ano)
    {
      id: 'seed-feeplan-ciclo-regular',
      name: '1.º Ciclo — Programa Regular',
      kind: FeeKind.PROPINA,
      service: '1.º Ciclo',
      program: FeeProgram.REGULAR,
      amountAkz: 405000,
      description: 'Horário 07:30–12:45.',
    },
    {
      id: 'seed-feeplan-ciclo-integral',
      name: '1.º Ciclo — Programa Integral',
      kind: FeeKind.PROPINA,
      service: '1.º Ciclo',
      program: FeeProgram.INTEGRAL,
      amountAkz: 575000,
      description: 'Horário 07:30–16:30, inclui almoço, lanche e pós-aulas.',
    },
    // Taxas anuais — Creche / Pré-Escolar / ATL (gerais)
    {
      id: 'seed-taxa-admissao',
      name: 'Admissão e Recursos Anuais',
      kind: FeeKind.TAXA,
      service: null,
      program: null,
      amountAkz: 205000,
      description: 'Inclui o seguro escolar. Creche/Pré-Escolar/ATL.',
    },
    {
      id: 'seed-taxa-inscricao',
      name: 'Inscrição (novos alunos)',
      kind: FeeKind.TAXA,
      service: null,
      program: null,
      amountAkz: 360000,
      description: 'Para novos alunos, no acto da matrícula.',
    },
    {
      id: 'seed-taxa-renovacao',
      name: 'Renovação de matrícula',
      kind: FeeKind.TAXA,
      service: null,
      program: null,
      amountAkz: 350000,
      description: 'Anualmente, no início de cada ano lectivo.',
    },
    // Taxas anuais — 1.º Ciclo
    {
      id: 'seed-taxa-ciclo-matricula',
      name: 'Matrícula + Kit pedagógico (1.º Ciclo)',
      kind: FeeKind.TAXA,
      service: '1.º Ciclo',
      program: null,
      amountAkz: 205000,
      description:
        'Seguro, cartão do aluno, manuais, cadernos, papéis e impressões.',
    },
    {
      id: 'seed-taxa-ciclo-renovacao',
      name: 'Renovação (1.º Ciclo)',
      kind: FeeKind.TAXA,
      service: '1.º Ciclo',
      program: null,
      amountAkz: 250000,
      description: 'Renovação de matrícula do 1.º Ciclo.',
    },
    // Produtos / serviços adicionais
    {
      id: 'seed-prod-alimentacao',
      name: 'Alimentação diária (avulsa)',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 20000,
    },
    {
      id: 'seed-prod-prolongamento',
      name: 'Prolongamento de horário (17h30–19h00, por hora)',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 15000,
      description: 'Inclui 2.º lanche.',
    },
    {
      id: 'seed-prod-uniforme-bibe',
      name: 'Uniforme — Bibe/Bata',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 30000,
    },
    {
      id: 'seed-prod-uniforme-polo',
      name: 'Uniforme — Polo',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 25000,
    },
    {
      id: 'seed-prod-uniforme-tshirt',
      name: 'Uniforme — T-shirt',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 20000,
    },
    {
      id: 'seed-prod-uniforme-calcao',
      name: 'Uniforme — Calção',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 18000,
    },
    {
      id: 'seed-prod-uniforme-casaco',
      name: 'Uniforme — Casaco',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 30000,
    },
    {
      id: 'seed-prod-uniforme-chapeu',
      name: 'Uniforme — Chapéu',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 20000,
    },
    {
      id: 'seed-prod-uniforme-lencois',
      name: 'Uniforme — Lençóis para catre',
      kind: FeeKind.PRODUTO,
      service: null,
      program: null,
      amountAkz: 27000,
    },

    // ───────────── Patriota (Alfa Kids) 2026/2027 ─────────────
    // Propinas mensais — Creche
    {
      id: 'seed-feeplan-pat-creche-meio',
      name: 'Creche — Meio tempo (sem alimentação)',
      kind: FeeKind.PROPINA,
      unit: 'Patriota',
      service: 'Creche',
      program: FeeProgram.MEIO_TEMPO,
      amountAkz: 210000,
      description: '3h/dia, sem refeições.',
    },
    {
      id: 'seed-feeplan-pat-creche-inteiro',
      name: 'Creche — Tempo inteiro',
      kind: FeeKind.PROPINA,
      unit: 'Patriota',
      service: 'Creche',
      program: FeeProgram.TEMPO_INTEIRO,
      amountAkz: 220000,
      description: 'Inclui 3 refeições diárias.',
    },
    // Propinas mensais — Pré-Escolar
    {
      id: 'seed-feeplan-pat-pre-meio',
      name: 'Pré-Escolar — Meio tempo (sem alimentação)',
      kind: FeeKind.PROPINA,
      unit: 'Patriota',
      service: 'Pré-Escolar',
      program: FeeProgram.MEIO_TEMPO,
      amountAkz: 210000,
      description: '3h/dia, sem refeições.',
    },
    {
      id: 'seed-feeplan-pat-pre-inteiro',
      name: 'Pré-Escolar — Tempo inteiro',
      kind: FeeKind.PROPINA,
      unit: 'Patriota',
      service: 'Pré-Escolar',
      program: FeeProgram.TEMPO_INTEIRO,
      amountAkz: 210000,
      description: 'Inclui 3 refeições diárias.',
    },
    // Propina mensal — ATL (programa único, com 2 refeições)
    {
      id: 'seed-feeplan-pat-atl',
      name: 'ATL',
      kind: FeeKind.PROPINA,
      unit: 'Patriota',
      service: 'ATL',
      program: FeeProgram.TEMPO_INTEIRO,
      amountAkz: 210000,
      description: 'Inclui 2 refeições diárias (almoço e lanche da tarde).',
    },
    // Taxas anuais — Patriota (Creche/Pré-Escolar)
    {
      id: 'seed-taxa-pat-admissao',
      name: 'Admissão e Recursos Anuais',
      kind: FeeKind.TAXA,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 120000,
      description: 'Inclui o seguro escolar. Creche/Pré-Escolar.',
    },
    {
      id: 'seed-taxa-pat-inscricao',
      name: 'Inscrição (novos alunos)',
      kind: FeeKind.TAXA,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 265000,
      description: 'Para novos alunos, no acto da matrícula.',
    },
    {
      id: 'seed-taxa-pat-renovacao',
      name: 'Renovação de matrícula',
      kind: FeeKind.TAXA,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 255000,
      description: 'Anualmente, no início de cada ano lectivo.',
    },
    // Produtos / adicionais — Patriota
    {
      id: 'seed-prod-pat-prolongamento',
      name: 'Prolongamento de horário (17h30–18h00, por hora)',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 8000,
      description: 'Inclui suplemento (2.º lanche).',
    },
    {
      id: 'seed-prod-pat-insc-actividades',
      name: 'Inscrição de actividades extracurriculares',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 10000,
    },
    {
      id: 'seed-prod-pat-uniforme-bibe',
      name: 'Uniforme — Bibe/Bata',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 25000,
    },
    {
      id: 'seed-prod-pat-uniforme-polo',
      name: 'Uniforme — Polo',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 19000,
    },
    {
      id: 'seed-prod-pat-uniforme-tshirt',
      name: 'Uniforme — T-shirt (Ginástica)',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 16000,
    },
    {
      id: 'seed-prod-pat-uniforme-calcao',
      name: 'Uniforme — Calção (Ginástica)',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 15000,
    },
    {
      id: 'seed-prod-pat-uniforme-casaco',
      name: 'Uniforme — Casaco',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 30000,
    },
    {
      id: 'seed-prod-pat-uniforme-chapeu',
      name: 'Uniforme — Chapéu',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 16000,
    },
    {
      id: 'seed-prod-pat-uniforme-lencois',
      name: 'Uniforme — Lençóis para catre',
      kind: FeeKind.PRODUTO,
      unit: 'Patriota',
      service: null,
      program: null,
      amountAkz: 18000,
    },
  ];

  // Unidades para o preçário (undefined = Gika/Sagrada Família).
  const feePlanUnitMap: Record<string, string> = {
    Gika: gika.id,
    Patriota: patriota.id,
  };

  // Remover planos-exemplo antigos antes de recriar o preçário real.
  await prisma.feePlan.deleteMany({
    where: { id: { startsWith: 'seed-feeplan-' } },
  });

  for (const plan of feePlanSeeds) {
    const serviceId = plan.service ? (services[plan.service] ?? null) : null;
    const unitId =
      plan.unit === undefined
        ? gika.id
        : plan.unit
          ? (feePlanUnitMap[plan.unit] ?? null)
          : null;
    const academicYearId = plan.kind === FeeKind.PRODUTO ? null : year.id;
    await prisma.feePlan.upsert({
      where: { id: plan.id },
      update: {
        name: plan.name,
        kind: plan.kind,
        amountAkz: plan.amountAkz,
        unitId,
        serviceId,
        program: plan.program,
        academicYearId,
        description: plan.description ?? null,
        active: true,
      },
      create: {
        id: plan.id,
        name: plan.name,
        kind: plan.kind,
        amountAkz: plan.amountAkz,
        unitId,
        serviceId,
        program: plan.program,
        academicYearId,
        description: plan.description ?? null,
        active: true,
      },
    });
  }

  await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      waitlistResponseHours: 48,
      waitlistDeadlineEnabled: true,
    },
  });

  // Amostra leve de PEI (só se já existir um aluno na base).
  const sampleStudent = await prisma.student.findFirst({
    orderBy: { createdAt: 'asc' },
    include: { neeProfile: true },
  });
  if (sampleStudent) {
    const profile =
      sampleStudent.neeProfile ??
      (await prisma.neeProfile.create({
        data: {
          studentId: sampleStudent.id,
          active: true,
          diagnosisSummary:
            'Necessidades Educativas Especiais — acompanhamento pedagógico diferenciado.',
          notes: 'Perfil de exemplo criado pelo seed.',
          identifiedAt: new Date(),
        },
      }));

    const existingPei = await prisma.peiPlan.findFirst({
      where: { studentId: sampleStudent.id },
    });
    if (!existingPei) {
      await prisma.peiPlan.create({
        data: {
          studentId: sampleStudent.id,
          neeProfileId: profile.id,
          academicYearId: sampleStudent.academicYearId,
          status: 'ACTIVO',
          title: 'PEI de exemplo',
          objectives:
            'Promover a autonomia nas rotinas da sala e reforçar a comunicação expressiva.',
          strategies:
            'Actividades em pequeno grupo, reforço positivo e adaptações no ritmo das tarefas.',
          supports: 'Apoio da educadora e articulação com a coordenação pedagógica.',
          guardianSummary:
            'O plano acompanha o desenvolvimento da criança com estratégias adaptadas na sala.',
          responsibleTeacher: 'Educadora de referência',
          reviewDate: new Date(new Date().getFullYear(), 11, 15),
          createdById: admin.id,
          reviews: {
            create: {
              date: new Date(),
              notes:
                'Primeira revisão de acompanhamento — progressos positivos na participação.',
              authorId: admin.id,
            },
          },
        },
      });
    }
  }

  console.log('Seed concluído.');
  console.log('Admin: admin@betteryoukids.com / Admin123!');
  console.log('Comunicação: comunicacao@betteryoukids.com / Comunica123!');
  console.log('Direcção: direcao@betteryoukids.com / Direcao123!');
  console.log('Coordenação: coordenacao@betteryoukids.com / Coordena123!');
  console.log('Encarregado: encarregado@betteryoukids.com / Encarrega123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
