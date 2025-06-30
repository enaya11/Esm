import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as cors from 'cors';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // إعدادات الأمان
  app.use(helmet());

  // إعدادات CORS
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // إعدادات التحقق من البيانات
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

  // إعداد Swagger للتوثيق
  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
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

  const port = configService.get<number>('PORT', 3000);
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