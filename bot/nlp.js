'use strict';

const axios = require('axios');
const { winstonLogger } = require('../middleware/logger');

const NLP_SERVICE_URL = process.env.NLP_SERVICE_URL || 'http://localhost:5000';

/**
 * Detect intent and extract city from free text using the Python NLP service.
 *
 * Returns:
 *   { intent: 'WEATHER'|'CURRENCY'|'GREETING'|'OTHER', city: string|null }
 */
async function detectIntent(text) {
  const { data } = await axios.post(
    `${NLP_SERVICE_URL}/analyze`,
    { text },
    { timeout: 4000 },
  );

  winstonLogger.info(
    `[NLP] "${text}" → intent=${data.intent} city=${data.city || '-'}`,
  );

  return {
    intent: data.intent,
    city:   data.city,
  };
}

module.exports = { detectIntent };
