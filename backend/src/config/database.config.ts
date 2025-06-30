import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  // القيم ثابتة هنا بدون قراءة من env
  const url = 'postgresql://postgres.aqunpkwwvslnmuqvotyl:enayabasmaji12@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

  return {
    type: 'postgres',
    url,
    ssl: {
      rejectUnauthorized: false,
    },
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