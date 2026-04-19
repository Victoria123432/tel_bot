const express = require('express');
const axios   = require('axios');
const config  = require('../config');
const { cacheMiddleware } = require('../middleware/cache');
const { winstonLogger }   = require('../middleware/logger');

const router = express.Router();
const TTL    = config.cache.ttlNews;

/**
 * GET /news?q=technology&lang=en&country=ua&max=10
 *
 * Query params:
 *   q       (optional) — search keyword          (default: "latest")
 *   lang    (optional) — language code           (default: en)
 *   country (optional) — 2-letter country code   (default: none)
 *   max     (optional) — number of articles 1–10 (default: 10)
 */
router.get('/', cacheMiddleware(TTL), async (req, res, next) => {
  const { q = 'latest', lang = 'en', country, max = 10 } = req.query;

  const maxInt = Math.min(Math.max(parseInt(max, 10) || 10, 1), 10);

  try {
    winstonLogger.info(`Fetching news: q="${q}" lang="${lang}" country="${country || '-'}" max=${maxInt}`);

    const params = {
      apikey: config.gnews.apiKey,
      q,
      lang,
      max: maxInt,
    };
    if (country) params.country = country;

    const { data } = await axios.get(`${config.gnews.baseUrl}/search`, {
      params,
      timeout: 10000,
    });

    const articles = (data.articles || []).map((a) => ({
      title:       a.title,
      description: a.description,
      content:     a.content,
      url:         a.url,
      image:       a.image,
      publishedAt: a.publishedAt,
      source: {
        name: a.source?.name,
        url:  a.source?.url,
      },
    }));

    res.json({
      success:      true,
      source:       'GNews',
      cached:       false,
      totalArticles: data.totalArticles,
      count:        articles.length,
      data:         articles,
    });
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      return res.status(status).json({
        success: false,
        error: { status, message: data?.errors?.[0] || 'GNews API error' },
      });
    }
    next(err);
  }
});

module.exports = router;
