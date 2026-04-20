const NodeCache = require("node-cache");
const { winstonLogger } = require("./logger");

const store = new NodeCache({ useClones: false });

function cacheMiddleware(ttl) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = store.get(key);

    if (cached !== undefined) {
      winstonLogger.info(`Cache HIT  → ${key}`);
      return res.json(cached);
    }

    winstonLogger.info(`Cache MISS → ${key}`);

    // Intercept res.json to store the response before sending it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode === 200) {
        store.set(key, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = { cacheMiddleware, store };
