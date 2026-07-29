import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

function swaggerEnabled(): boolean {
  const flag = process.env.SWAGGER_ENABLED;
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

function warnProductionHardening() {
  if (process.env.NODE_ENV !== 'production') return;

  const weakSecrets = ['change-me', 'change-me-too', 'secret', 'jwt-secret'];
  const jwt = (process.env.JWT_SECRET || '').trim();
  const refresh = (process.env.JWT_REFRESH_SECRET || '').trim();

  if (!jwt || jwt.length < 32 || weakSecrets.includes(jwt.toLowerCase())) {
    console.warn(
      '[SECURITY] JWT_SECRET fraco ou em falta em produção — use um segredo longo e aleatório.',
    );
  }
  if (
    refresh &&
    (refresh.length < 32 || weakSecrets.includes(refresh.toLowerCase()))
  ) {
    console.warn(
      '[SECURITY] JWT_REFRESH_SECRET fraco em produção — use um segredo longo e aleatório.',
    );
  }
  if (swaggerEnabled()) {
    console.warn(
      '[SECURITY] Swagger activo em produção (/docs). Defina SWAGGER_ENABLED=false salvo necessidade explícita.',
    );
  }
  if ((process.env.CORS_ORIGIN || '').includes('*')) {
    console.warn(
      '[SECURITY] CORS_ORIGIN contém "*" — incompatível com cookies credentials.',
    );
  }
}

async function bootstrap() {
  warnProductionHardening();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const origins = (process.env.CORS_ORIGIN || 'http://localhost:8080')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });

  app.use(cookieParser());

  // SEC-05: cabeçalhos de segurança HTTP (API; CSP desactivado para não quebrar Swagger/SPA)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // SEC-02: bloquear acesso estático a documentos sensíveis
  app.use('/uploads/documents', (_req: IncomingMessage, res: ServerResponse) => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        message: 'Documento indisponível. Utilize o endpoint autenticado.',
      }),
    );
  });

  // Media CMS / galeria pública continua acessível sob /uploads (excepto /documents)
  app.useStaticAssets(join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'), {
    prefix: '/uploads',
  });

  if (swaggerEnabled()) {
    const swagger = new DocumentBuilder()
      .setTitle('BetterYou Kids API')
      .setDescription('API da plataforma escolar BetterYou Kids')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('by_access_token')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
  }

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`BetterYou Kids API em http://localhost:${port}/api`);
  if (swaggerEnabled()) {
    console.log(`Swagger em http://localhost:${port}/docs`);
  } else {
    console.log('Swagger desactivado (produção ou SWAGGER_ENABLED=false)');
  }
}

bootstrap();
