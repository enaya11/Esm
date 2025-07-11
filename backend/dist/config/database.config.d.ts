import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
export declare const getDatabaseConfig: (configService: ConfigService) => TypeOrmModuleOptions;
export declare const getRedisConfig: () => {
    host: string;
    port: number;
    password: undefined;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    maxRetriesPerRequest: undefined;
};
