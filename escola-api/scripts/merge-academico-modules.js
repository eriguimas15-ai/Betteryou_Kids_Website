/**
 * Non-destructive merge: ensure system profiles have the modules used by
 * períodos / boletins / monitorização académica (reuses existing keys).
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ENSURE = {
  ADMIN: [
    'dashboard',
    'painel',
    'portal',
    'academico',
    'comunicados',
    'nee',
    'presencas',
  ],
  DIRECAO: ['dashboard', 'painel', 'portal', 'academico', 'comunicados', 'nee', 'presencas'],
  COORDENACAO: ['dashboard', 'portal', 'academico', 'comunicados', 'nee', 'presencas'],
  PROFESSOR: ['dashboard', 'academico', 'comunicados', 'nee', 'presencas'],
  ENCARREGADO: ['portal'],
  COMUNICACAO: ['comunicados'],
};

(async () => {
  const results = [];
  for (const [systemKey, keys] of Object.entries(ENSURE)) {
    const profile = await prisma.accessProfile.findUnique({
      where: { systemKey },
    });
    if (!profile) {
      results.push({ systemKey, action: 'missing' });
      continue;
    }
    const mods = Array.isArray(profile.modules) ? [...profile.modules] : [];
    const added = [];
    for (const key of keys) {
      if (!mods.includes(key)) {
        mods.push(key);
        added.push(key);
      }
    }
    if (added.length) {
      await prisma.accessProfile.update({
        where: { id: profile.id },
        data: { modules: mods },
      });
    }
    results.push({
      systemKey,
      name: profile.name,
      action: added.length ? 'updated' : 'unchanged',
      added,
    });
  }
  console.log(JSON.stringify(results, null, 2));
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
