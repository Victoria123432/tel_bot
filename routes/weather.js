const express = require('express');
const { cacheMiddleware }  = require('../middleware/cache');
const { winstonLogger }    = require('../middleware/logger');
const { getWeather }       = require('../services/weatherService');

const router = express.Router();

/**
 * GET /weather?city=Kyiv&units=metric&lang=en
 */
router.get('/', cacheMiddleware(0), async (req, res, next) => {
  const { city, units = 'metric', lang = 'en' } = req.query;

  if (!city) {
    return res.status(400).json({
      success: false,
      error: { status: 400, message: 'Query param "city" is required.' },
    });
  }

  try {
    const weather = await getWeather(city, units, lang);
    const u = weather.temperature.unit;

    res.json({
      success: true,
      source:  'OpenWeatherMap',
      cached:  weather.cached,
      data: {
        city:        weather.city,
        country:     weather.country,
        coordinates: weather.coordinates,
        weather:     weather.weather,
        temperature: {
          current:   `${weather.temperature.current}${u}`,
          feelsLike: `${weather.temperature.feelsLike}${u}`,
          min:       `${weather.temperature.min}${u}`,
          max:       `${weather.temperature.max}${u}`,
        },
        humidity:   `${weather.humidity}%`,
        wind:       weather.wind,
        visibility: weather.visibility,
        sunrise:    weather.sunrise,
        sunset:     weather.sunset,
        timestamp:  weather.timestamp,
      },
    });
  } catch (err) {
    if (err.response) {
      const { status, data } = err.response;
      return res.status(status).json({
        success: false,
        error: { status, message: data?.message || 'OpenWeatherMap error' },
      });
    }
    next(err);
  }
});

module.exports = router;
