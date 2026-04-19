const express = require('express');
const { cacheMiddleware } = require('../middleware/cache');
const { getRates }        = require('../services/currencyService');

const router = express.Router();

/**
 * GET /currency?base=EUR&symbols=USD,UAH,GBP
 *
 * Note: ExchangeRatesAPI free plan supports EUR as base only.
 */
router.get('/', cacheMiddleware(0), async (req, res, next) => {
  const { base = 'EUR', symbols } = req.query;
  const symbolList = symbols ? symbols.toUpperCase().split(',') : [];

  try {
    const result = await getRates(base, symbolList);

    res.json({
      success: true,
      source:  'ExchangeRatesAPI',
      cached:  result.cached,
      data: {
        base:      result.base,
        date:      result.date,
        timestamp: result.timestamp,
        rates:     result.rates,
      },
    });
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      return res.status(status).json({
        success: false,
        error: { status, message: data?.error?.info || 'ExchangeRatesAPI error' },
      });
    }
    if (err.code) {
      return res.status(502).json({
        success: false,
        error: { status: 502, message: err.message, code: err.code },
      });
    }
    next(err);
  }
});

module.exports = router;
