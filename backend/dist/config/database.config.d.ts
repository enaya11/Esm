import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare const getDatabaseConfig: () => TypeOrmModuleOptions;
export declare const getRedisConfig: () => {
    host: string;
    port: number;
    password: undefined;
    retryDelayOnFailover: number;
    enableReadyCheck: boolean;
    maxRetriesPerRequest: undefined;
};
