const axios  = require('axios');
const config = require('../config');
const { store } = require('../middleware/cache');
const { winstonLogger } = require('../middleware/logger');

const TTL = config.cache.ttlWeather;

/**
 * Fetch current weather for a city.
 * Returns a plain data object (used by both REST route and Telegram bot).
 *
 * @param {string} city
 * @param {string} [units='metric']
 * @param {string} [lang='en']
 * @returns {Promise<object>}
 */
async function getWeather(city, units = 'metric', lang = 'en') {
  const cacheKey = `weather:${city.toLowerCase()}:${units}:${lang}`;
  const cached = store.get(cacheKey);
  if (cached) {
    winstonLogger.info(`Cache HIT (service) → weather "${city}"`);
    return { ...cached, cached: true };
  }

  winstonLogger.info(`Fetching weather for city="${city}" units="${units}" lang="${lang}"`);

  const { data } = await axios.get(`${config.openWeather.baseUrl}/weather`, {
    params: { q: city, units, lang, appid: config.openWeather.apiKey },
    timeout: 8000,
  });

  const unitLabel = units === 'imperial' ? '°F' : units === 'metric' ? '°C' : 'K';

  const result = {
    cached:  false,
    city:        data.name,
    country:     data.sys.country,
    coordinates: { lat: data.coord.lat, lon: data.coord.lon },
    weather: {
      description: data.weather[0].description,
      icon:        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    },
    temperature: {
      current:   data.main.temp,
      feelsLike: data.main.feels_like,
      min:       data.main.temp_min,
      max:       data.main.temp_max,
      unit:      unitLabel,
    },
    humidity:   data.main.humidity,
    wind:       { speed: data.wind.speed, direction: data.wind.deg },
    visibility: data.visibility,
    sunrise:    new Date(data.sys.sunrise * 1000).toISOString(),
    sunset:     new Date(data.sys.sunset  * 1000).toISOString(),
    timestamp:  new Date(data.dt * 1000).toISOString(),
  };

  store.set(cacheKey, result, TTL);
  return result;
}

module.exports = { getWeather };
