const axios  = require('axios');
const config = require('../config');
const { store } = require('../middleware/cache');
const { winstonLogger } = require('../middleware/logger');

const TTL = config.cache.ttlCurrency;

/**
 * Fetch latest exchange rates.
 * Free plan of ExchangeRatesAPI only supports EUR as base currency.
 *
 * @param {string}   [base='EUR']
 * @param {string[]} [symbols=[]]  — empty means all currencies
 * @returns {Promise<object>}
 */
async function getRates(base = 'EUR', symbols = []) {
  const symKey  = symbols.length ? symbols.join(',') : 'ALL';
  const cacheKey = `currency:${base}:${symKey}`;
  const cached   = store.get(cacheKey);
  if (cached) {
    winstonLogger.info(`Cache HIT (service) → currency base="${base}"`);
    return { ...cached, cached: true };
  }

  winstonLogger.info(`Fetching exchange rates: base="${base}" symbols="${symKey}"`);

  const params = { access_key: config.exchangeRates.apiKey, base };
  if (symbols.length) params.symbols = symbols.join(',').toUpperCase();

  const { data } = await axios.get(`${config.exchangeRates.baseUrl}/latest`, {
    params,
    timeout: 8000,
  });

  if (!data.success) {
    const err = new Error(data.error?.info || 'ExchangeRatesAPI error');
    err.code = data.error?.code;
    throw err;
  }

  const result = {
    cached:    false,
    base:      data.base,
    date:      data.date,
    timestamp: new Date(data.timestamp * 1000).toISOString(),
    rates:     data.rates,
  };

  store.set(cacheKey, result, TTL);
  return result;
}

module.exports = { getRates };
