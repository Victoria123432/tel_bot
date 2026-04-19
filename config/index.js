require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,

  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY,
    baseUrl: process.env.OPENWEATHER_BASE_URL,
  },

  exchangeRates: {
    apiKey: process.env.EXCHANGERATES_API_KEY,
    baseUrl: process.env.EXCHANGERATES_BASE_URL,
  },

  gnews: {
    apiKey: process.env.GNEWS_API_KEY,
    baseUrl: process.env.GNEWS_BASE_URL,
  },

  cache: {
    ttlWeather:  parseInt(process.env.CACHE_TTL_WEATHER,  10) || 600,
    ttlCurrency: parseInt(process.env.CACHE_TTL_CURRENCY, 10) || 3600,
    ttlNews:     parseInt(process.env.CACHE_TTL_NEWS,     10) || 900,
  },
};
