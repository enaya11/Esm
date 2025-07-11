import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const url = configService.get<string>('DATABASE_URL');

  if (!url) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
  }

  return {
    type: 'postgres',
    url,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // خليه false في التجربة عشان ما يعدل الداتا
    logging: false,
    extra: {
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
    retryAttempts: 5,
    retryDelay: 3000,
    ssl: {
      rejectUnauthorized: false,
    },
  };
};

export const getRedisConfig = () => {
  // قيم ريديس ثابتة للتجربة
  return {
    host: 'localhost',
    port: 6379,
    password: undefined,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: undefined,
  };
};