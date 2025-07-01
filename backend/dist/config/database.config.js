"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = exports.getDatabaseConfig = void 0;
const getDatabaseConfig = () => {
    const url = 'postgresql://postgres.aqunpkwwvslnmuqvotyl:enayabasmaji12@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
    return {
        type: 'postgres',
        url,
        ssl: {
            rejectUnauthorized: false,
        },
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