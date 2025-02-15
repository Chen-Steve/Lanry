import { createClient, RedisClientType } from 'redis';

const redisClient: RedisClientType = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '12672')
    }
});

redisClient.on('error', (err: Error) => {
    console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('Redis Client Connected');
});

// Don't connect automatically - let the consuming code handle that
let isConnected = false;

export async function connectToRedis() {
    if (!isConnected) {
        await redisClient.connect();
        isConnected = true;
    }
}

export async function disconnectFromRedis() {
    if (isConnected) {
        await redisClient.disconnect();
        isConnected = false;
    }
}

export { redisClient }; 