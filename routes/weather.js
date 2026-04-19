const express = require('express');
const axios   = require('axios');
const config  = require('../config');
const { cacheMiddleware } = require('../middleware/cache');
const { winstonLogger }   = require('../middleware/logger');

const router = express.Router();
const TTL    = config.cache.ttlWeather;

/**
 * GET /weather?city=Kyiv&units=metric&lang=ua
 *
 * Query params:
 *   city  (required) — city name
 *   units (optional) — standard | metric | imperial  (default: metric)
 *   lang  (optional) — language code              (default: en)
 */
router.get('/', cacheMiddleware(TTL), async (req, res, next) => {
  const { city, units = 'metric', lang = 'en' } = req.query;

  if (!city) {
    return res.status(400).json({
      success: false,
      error: { status: 400, message: 'Query param "city" is required.' },
    });
  }

  try {
    winstonLogger.info(`Fetching weather for city="${city}" units="${units}" lang="${lang}"`);

    const { data } = await axios.get(`${config.openWeather.baseUrl}/weather`, {
      params: {
        q:     city,
        units,
        lang,
        appid: config.openWeather.apiKey,
      },
      timeout: 8000,
    });

    const unitLabel = units === 'imperial' ? '°F' : units === 'metric' ? '°C' : 'K';

    res.json({
      success: true,
      source:  'OpenWeatherMap',
      cached:  false,
      data: {
        city:        data.name,
        country:     data.sys.country,
        coordinates: { lat: data.coord.lat, lon: data.coord.lon },
        weather: {
          description: data.weather[0].description,
          icon:        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
        },
        temperature: {
          current:   `${data.main.temp}${unitLabel}`,
          feelsLike: `${data.main.feels_like}${unitLabel}`,
          min:       `${data.main.temp_min}${unitLabel}`,
          max:       `${data.main.temp_max}${unitLabel}`,
        },
        humidity:  `${data.main.humidity}%`,
        wind:      { speed: `${data.wind.speed} m/s`, direction: data.wind.deg },
        visibility: data.visibility,
        sunrise:   new Date(data.sys.sunrise * 1000).toISOString(),
        sunset:    new Date(data.sys.sunset  * 1000).toISOString(),
        timestamp: new Date(data.dt * 1000).toISOString(),
      },
    });
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      const msg = data?.message || 'OpenWeatherMap error';
      return res.status(status).json({
        success: false,
        error: { status, message: msg },
      });
    }
    next(err);
  }
});

module.exports = router;
