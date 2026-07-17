import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const origins = (process.env.CORS_ORIGIN || 'http://localhost:8080')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useStaticAssets(join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'), {
    prefix: '/uploads',
  });

  const swagger = new DocumentBuilder()
    .setTitle('BetterYou Kids API')
    .setDescription('API da plataforma escolar BetterYou Kids')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`BetterYou Kids API em http://localhost:${port}/api`);
  console.log(`Swagger em http://localhost:${port}/docs`);
}

bootstrap();
