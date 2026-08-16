const redis = require('redis');

let redisClient = null;
let isRedisConnected = false;

if (process.env.REDIS_URL || process.env.NODE_ENV !== 'test') {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  });

  redisClient.on('error', (err) => {
    console.warn('Redis connection warning/error:', err.message);
    isRedisConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis client connecting...');
  });

  redisClient.on('ready', () => {
    console.log('Redis Connected Successfully ✅');
    isRedisConnected = true;
  });

  // Connect asynchronously
  redisClient.connect().catch((err) => {
    console.warn('Redis failed to connect. Falling back to non-cached operations.', err.message);
    isRedisConnected = false;
  });
}

const getRedisClient = () => redisClient;
const checkRedisStatus = () => isRedisConnected;

module.exports = {
  getRedisClient,
  checkRedisStatus
};
