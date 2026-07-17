import { PrismaClient, Role, ContentStatus, JobStatus } from '@prisma/client';
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
        'inscricoes',
        'renovacoes',
        'ficha',
        'espera',
        'salas',
        'turmas',
        'emprego',
        'conteudo',
        'acessos',
      ],
    },
    {
      systemKey: 'DIRECAO',
      name: 'Direcção',
      modules: [
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
    },
    {
      systemKey: 'COMUNICACAO',
      name: 'Comunicação',
      modules: ['inscricoes', 'emprego', 'conteudo'],
    },
    {
      systemKey: 'COORDENACAO',
      name: 'Coordinação',
      modules: [
        'dashboard',
        'inscricoes',
        'renovacoes',
        'ficha',
        'espera',
        'salas',
        'turmas',
      ],
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

  const gika = await prisma.unit.upsert({
    where: { name: 'Gika' },
    update: {},
    create: {
      name: 'Gika',
      address: 'Av. Cmte. Gika 150, Luanda',
    },
  });

  const patriota = await prisma.unit.upsert({
    where: { name: 'Patriota' },
    update: {},
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
        unitName: 'Gika',
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

  const activities = [
    { name: 'Ginástica', category: 'Desportiva', sortOrder: 1 },
    { name: 'Inglês', category: 'Educativa', sortOrder: 2 },
    { name: 'Música', category: 'Artística', sortOrder: 3 },
    { name: 'Jiu-Jitsu', category: 'Desportiva', sortOrder: 4 },
    { name: 'Ballet', category: 'Artística', sortOrder: 5 },
    { name: 'Xadrez', category: 'Educativa', sortOrder: 6 },
    { name: 'Dança Criativa', category: 'Artística', sortOrder: 7 },
    { name: 'Artes', category: 'Artística', sortOrder: 8 },
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
  const serviceActivityMatrix: Array<{
    activity: string;
    service: string;
    pricing: PricingKind;
    priceAkz?: number;
  }> = [
    // Creche / Pré-Escolar / ATL — incluídas
    { activity: 'Ginástica', service: 'Creche', pricing: 'INCLUDED' },
    { activity: 'Inglês', service: 'Creche', pricing: 'INCLUDED' },
    { activity: 'Música', service: 'Creche', pricing: 'INCLUDED' },
    { activity: 'Ginástica', service: 'Pré-Escolar', pricing: 'INCLUDED' },
    { activity: 'Inglês', service: 'Pré-Escolar', pricing: 'INCLUDED' },
    { activity: 'Música', service: 'Pré-Escolar', pricing: 'INCLUDED' },
    { activity: 'Ginástica', service: 'ATL', pricing: 'INCLUDED' },
    { activity: 'Inglês', service: 'ATL', pricing: 'INCLUDED' },
    { activity: 'Música', service: 'ATL', pricing: 'INCLUDED' },
    // Creche — opcional paga
    {
      activity: 'Dança Criativa',
      service: 'Creche',
      pricing: 'PAID',
      priceAkz: 40000,
    },
    // Pré-Escolar / ATL — opcionais pagas
    {
      activity: 'Jiu-Jitsu',
      service: 'Pré-Escolar',
      pricing: 'PAID',
      priceAkz: 40000,
    },
    {
      activity: 'Ballet',
      service: 'Pré-Escolar',
      pricing: 'PAID',
      priceAkz: 40000,
    },
    {
      activity: 'Xadrez',
      service: 'Pré-Escolar',
      pricing: 'PAID',
      priceAkz: 30000,
    },
    {
      activity: 'Jiu-Jitsu',
      service: 'ATL',
      pricing: 'PAID',
      priceAkz: 40000,
    },
    { activity: 'Ballet', service: 'ATL', pricing: 'PAID', priceAkz: 40000 },
    { activity: 'Xadrez', service: 'ATL', pricing: 'PAID', priceAkz: 30000 },
    // 1.º Ciclo — extracurriculares opcionais
    {
      activity: 'Jiu-Jitsu',
      service: '1.º Ciclo',
      pricing: 'PAID',
      priceAkz: 40000,
    },
    {
      activity: 'Ballet',
      service: '1.º Ciclo',
      pricing: 'PAID',
      priceAkz: 40000,
    },
    {
      activity: 'Xadrez',
      service: '1.º Ciclo',
      pricing: 'PAID',
      priceAkz: 30000,
    },
    {
      activity: 'Artes',
      service: '1.º Ciclo',
      pricing: 'PAID',
      priceAkz: 45000,
    },
  ];

  await prisma.activityServiceOffering.deleteMany({});
  for (const row of serviceActivityMatrix) {
    const activityId = activityIds[row.activity];
    const serviceId = services[row.service];
    if (!activityId || !serviceId) continue;
    await prisma.activityServiceOffering.create({
      data: {
        activityId,
        serviceId,
        pricing: row.pricing,
        priceAkz: row.pricing === 'PAID' ? (row.priceAkz ?? null) : null,
        active: true,
      },
    });
  }

  console.log('Seed concluído.');
  console.log('Admin: admin@betteryoukids.com / Admin123!');
  console.log('Comunicação: comunicacao@betteryoukids.com / Comunica123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
