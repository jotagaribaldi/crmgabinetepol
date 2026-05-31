"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('CRM Político API')
        .setDescription('API do CRM Político Multi-Tenant para gerenciamento de campanhas eleitorais')
        .setVersion('1.0')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
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
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });
    const port = process.env.PORT || 3002;
    await app.listen(port);
    logger.log(`🚀 CRM Político API rodando em: http://localhost:${port}/api/v1`);
    logger.log(`📚 Swagger disponível em: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map