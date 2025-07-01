"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const cors = require("cors");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('SmartCoin API')
        .setDescription('🚀 واجهة برمجة التطبيقات لمنصة SmartCoin - أقوى منصة تعدين ذكي بدعم 350 مليون دولار')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('المصادقة', 'عمليات تسجيل الدخول والمصادقة')
        .addTag('المدفوعات', 'عمليات الدفع والتحقق من المعاملات')
        .addTag('التعدين', 'عمليات التعدين والمطالبة بالعملات')
        .addTag('الإحالات', 'نظام الإحالات والمكافآت')
        .addTag('المستخدمين', 'إدارة المستخدمين والملفات الشخصية')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'SmartCoin API Documentation',
        customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #FFD700; }
      .swagger-ui .scheme-container {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    `,
    });
    app.setGlobalPrefix('api/v1');
    const port = configService.get('PORT', 3000);
    await app.listen(port);
    console.log(`
🚀 SmartCoin Backend Server is running!
📍 Server: http://localhost:${port}
📚 API Docs: http://localhost:${port}/api/docs
💰 بدعم رأس مال 350 مليون دولار
🌟 أقوى منصة تداول لامركزية في العالم
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map