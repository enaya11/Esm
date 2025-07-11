"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = exports.getDatabaseConfig = void 0;
const getDatabaseConfig = (configService) => {
    const url = configService.get('DATABASE_URL');
    if (!url) {
        throw new Error('DATABASE_URL is not defined in environment variables.');
    }
    return {
        type: 'postgres',
        url,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
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
exports.getDatabaseConfig = getDatabaseConfig;
const getRedisConfig = () => {
    return {
        host: 'localhost',
        port: 6379,
        password: undefined,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: undefined,
    };
};
exports.getRedisConfig = getRedisConfig;
//# sourceMappingURL=database.config.js.map