"use strict";

const { getWeather } = require("../services/weatherService");
const { getRates } = require("../services/currencyService");

/**
 * Format weather data into a human-readable Telegram message (Markdown).
 */
async function buildWeatherMessage(city, units = "metric", lang = "uk") {
  const w = await getWeather(city, units, lang);
  const u = w.temperature.unit;

  const windDir = degToCompass(w.wind.direction);
  const sunrise = formatTime(w.sunrise);
  const sunset = formatTime(w.sunset);

  return (
    `*Погода: ${w.city}, ${w.country}*\n` +
    `📋 ${capitalize(w.weather.description)}\n\n` +
    ` Температура:  *${w.temperature.current}${u}*  (відчувається ${w.temperature.feelsLike}${u})\n` +
    ` Макс: ${w.temperature.max}${u}   🔽 Мін: ${w.temperature.min}${u}\n\n` +
    ` Вологість: ${w.humidity}%\n` +
    ` Вітер: ${w.wind.speed} м/с, ${windDir}\n` +
    ` Видимість: ${(w.visibility / 1000).toFixed(1)} км\n\n` +
    ` Схід: ${sunrise}    Захід: ${sunset}\n` +
    `${w.cached ? "_(з кешу)_" : ""}`
  );
}

/**
 * Format currency rates into a human-readable Telegram message (Markdown).
 * @param {string[]} symbols  e.g. ['USD','UAH','GBP']
 */
async function buildCurrencyMessage(
  symbols = ["USD", "UAH", "GBP", "PLN", "CHF"],
) {
  const result = await getRates("EUR", symbols);

  const lines = Object.entries(result.rates)
    .map(([code, rate]) => `  • *${code}*: \`${rate.toFixed(4)}\``)
    .join("\n");

  return (
    ` *Курс валют відносно EUR*\n` +
    ` Дата: ${result.date}\n\n` +
    `{lines}\n\n` +
    `_Джерело: ExchangeRatesAPI_  ${result.cached ? "_(з кешу)_" : ""}`
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Kyiv",
  });
}

function degToCompass(deg) {
  if (deg === undefined || deg === null) return "";
  const dirs = ["Пн", "ПнСх", "Сх", "ПдСх", "Пд", "ПдЗх", "Зх", "ПнЗх"];
  return dirs[Math.round(deg / 45) % 8];
}

module.exports = { buildWeatherMessage, buildCurrencyMessage };
