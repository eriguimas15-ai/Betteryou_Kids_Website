import { PrismaClient, ContentStatus } from '@prisma/client';
import {
  SEED_ACTIVITY_CARDS,
  SEED_JORNADA_ITEMS,
  SEED_SERVICE_CARDS,
} from '../src/cms/site-content-defaults';

const prisma = new PrismaClient();

async function upsertPage(
  slug: string,
  title: string,
  key: string,
  label: string,
  value: string,
) {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('Admin não encontrado');
  await prisma.contentPage.upsert({
    where: { slug },
    update: {
      title,
      status: ContentStatus.PUBLICADO,
      publishedAt: new Date(),
    },
    create: {
      slug,
      title,
      status: ContentStatus.PUBLICADO,
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });
  const page = await prisma.contentPage.findUnique({ where: { slug } });
  if (!page) throw new Error(`Página ${slug} em falta`);
  await prisma.contentSection.upsert({
    where: { pageId_key: { pageId: page.id, key } },
    create: { pageId: page.id, key, label, value, sortOrder: 0 },
    update: { label, value },
  });
  console.log('OK', slug);
}

async function main() {
  await upsertPage(
    'sobre',
    'Sobre / Nossa Jornada',
    'jornada_items',
    'Marcos da jornada',
    JSON.stringify(SEED_JORNADA_ITEMS),
  );
  await upsertPage(
    'servicos',
    'Serviços',
    'service_cards',
    'Cartões de serviços',
    JSON.stringify(SEED_SERVICE_CARDS),
  );
  await upsertPage(
    'actividades',
    'Actividades Extracurriculares',
    'activity_cards',
    'Actividades do site',
    JSON.stringify(SEED_ACTIVITY_CARDS),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
