const { getRedisClient, checkRedisStatus } = require('../config/redis');

// Middleware to cache JSON responses using Redis
exports.cache = (durationSeconds = 300) => {
  return async (req, res, next) => {
    // If Redis is not active/connected, skip caching
    if (!checkRedisStatus()) {
      return next();
    }

    // Construct tenant-isolated key based on user scope and URL query path
    const tenantId = req.user?.companyId?.toString() || 'global';
    const cacheKey = `cache:${tenantId}:${req.originalUrl || req.url}`;

    try {
      const client = getRedisClient();
      const cachedData = await client.get(cacheKey);

      if (cachedData) {
        // Return cached output immediately
        return res.status(200).json(JSON.parse(cachedData));
      }

      // Override res.json to capture response payload
      const originalJson = res.json;
      res.json = function (body) {
        // Only cache successful requests
        if (res.statusCode >= 200 && res.statusCode < 300) {
          client.set(cacheKey, JSON.stringify(body), {
            EX: durationSeconds
          }).catch(err => console.warn('Cache write failed:', err.message));
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.warn('Cache lookup failed:', err.message);
      next();
    }
  };
};

// Utility helper to invalidate cache keys by pattern (e.g. invalidating service lists on service updates)
exports.invalidateCache = async (tenantId, pattern) => {
  if (!checkRedisStatus()) return;

  try {
    const client = getRedisClient();
    const searchPattern = `cache:${tenantId || '*'}:${pattern || '*'}`;
    const keys = await client.keys(searchPattern);

    if (keys.length > 0) {
      await client.del(keys);
      console.log(`Invalidated ${keys.length} cache keys matching pattern ${searchPattern}`);
    }
  } catch (err) {
    console.warn('Cache invalidation error:', err.message);
  }
};
