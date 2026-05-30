import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('CRM Político API')
    .setDescription(
      'API do CRM Político Multi-Tenant para gerenciamento de campanhas eleitorais',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('auth', 'Autenticação')
    .addTag('tenants', 'Candidatos (Tenants)')
    .addTag('users', 'Usuários')
    .addTag('states', 'Estados')
    .addTag('municipalities', 'Municípios')
    .addTag('regions', 'Regiões')
    .addTag('segments', 'Segmentos')
    .addTag('voters', 'Eleitores')
    .addTag('dashboards', 'Dashboards')
    .addTag('reports', 'Relatórios')
    .addTag('audit', 'Auditoria')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 CRM Político API rodando em: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger disponível em: http://localhost:${port}/api/docs`);
}

bootstrap();
