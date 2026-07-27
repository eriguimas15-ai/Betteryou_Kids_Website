const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TARGET_KEYS = ['ADMIN', 'DIRECAO', 'COORDENACAO', 'PROFESSOR'];

(async () => {
  const before = await prisma.accessProfile.findMany({
    select: { id: true, name: true, systemKey: true, modules: true },
    orderBy: { name: 'asc' },
  });
  console.log('=== BEFORE ===');
  for (const p of before) {
    const mods = Array.isArray(p.modules) ? p.modules : [];
    console.log(JSON.stringify({ systemKey: p.systemKey, name: p.name, hasNee: mods.includes('nee'), modules: mods }));
  }

  const updated = [];
  for (const key of TARGET_KEYS) {
    const profile = await prisma.accessProfile.findUnique({ where: { systemKey: key } });
    if (!profile) {
      console.log('MISSING profile:', key);
      continue;
    }
    const mods = Array.isArray(profile.modules) ? [...profile.modules] : [];
    if (!mods.includes('nee')) {
      mods.push('nee');
      await prisma.accessProfile.update({
        where: { id: profile.id },
        data: { modules: mods },
      });
      updated.push({ systemKey: key, name: profile.name, action: 'added nee' });
    } else {
      updated.push({ systemKey: key, name: profile.name, action: 'already had nee' });
    }
  }

  console.log('=== UPDATE RESULTS ===');
  console.log(JSON.stringify(updated, null, 2));

  const after = await prisma.accessProfile.findMany({
    where: { systemKey: { in: [...TARGET_KEYS, 'ENCARREGADO', 'COMUNICACAO'] } },
    select: { name: true, systemKey: true, modules: true },
    orderBy: { systemKey: 'asc' },
  });
  console.log('=== AFTER (targeted + encarregado/comunicacao) ===');
  for (const p of after) {
    const mods = Array.isArray(p.modules) ? p.modules : [];
    console.log(JSON.stringify({ systemKey: p.systemKey, name: p.name, hasNee: mods.includes('nee'), modules: mods }));
  }

  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
