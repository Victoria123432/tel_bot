const express = require("express");
const axios = require("axios");
const config = require("../config");
const { cacheMiddleware } = require("../middleware/cache");
const { winstonLogger } = require("../middleware/logger");

const router = express.Router();
const TTL = config.cache.ttlCurrency;

/**
  http://localhost:3000/currency?symbols=USD,UAH
 */
router.get("/", cacheMiddleware(TTL), async (req, res, next) => {
  const { base = "EUR", symbols } = req.query;

  try {
    winstonLogger.info(
      `Fetching exchange rates: base="${base}" symbols="${symbols || "all"}"`,
    );

    const params = {
      access_key: config.exchangeRates.apiKey,
      base,
    };
    if (symbols) params.symbols = symbols.toUpperCase();

    const { data } = await axios.get(`${config.exchangeRates.baseUrl}/latest`, {
      params,
      timeout: 8000,
    });

    if (!data.success) {
      const errInfo = data.error || {};
      return res.status(502).json({
        success: false,
        error: {
          status: 502,
          message: errInfo.info || "ExchangeRatesAPI returned an error.",
          code: errInfo.code,
        },
      });
    }

    res.json({
      success: true,
      source: "ExchangeRatesAPI",
      cached: false,
      data: {
        base: data.base,
        date: data.date,
        timestamp: new Date(data.timestamp * 1000).toISOString(),
        rates: data.rates,
      },
    });
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      return res.status(status).json({
        success: false,
        error: {
          status,
          message: data?.error?.info || "ExchangeRatesAPI error",
        },
      });
    }
    next(err);
  }
});

module.exports = router;
