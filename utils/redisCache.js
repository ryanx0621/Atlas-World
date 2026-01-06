const Redis = require('ioredis');

let client = null;

const redisCache = {
    connect: () => {
        if (!client) {
            client = new Redis({
                port: 13534,
                host: 'redis-13534.crce178.ap-east-1-1.ec2.redns.redis-cloud.com',
                password: 'l5aS3hmu4x6kOOdnyaKKgme5Xrd22PSw',
             // tls: {} 使用 tls 連線
            });

            client.on('connect', () => {
                console.log('✅ Redis 已連線');
            });

            client.on('error', (err) => {
                console.error('❌ Redis 錯誤:', err);
            });

            // 每小時清除 temp:* 的緩存
            setInterval(async () => {
                const keys = await client.keys('temp:*');
                if (keys.length > 0) {
                    await client.del(...keys);
                    console.log('🧹 Redis temp:* 緩存已清除');
                }
            }, 1000 * 60 * 60);
        }
    },

    set: async (key, value, ttlSec = 3600) => {
        if (!client) return;
        await client.set(key, JSON.stringify(value), 'EX', ttlSec);
    },

    get: async (key) => {
        if (!client) return null;
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    },

    del: async (key) => {
        if (!client) return;
        await client.del(key);
    },

    cleanup: async (pattern) => {
        if (!client) return;
        const keys = await client.keys(pattern);
        if (keys.length > 0) await client.del(...keys);
    },

    raw: () => client,
};

module.exports = redisCache;