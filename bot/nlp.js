"use strict";

const INTENTS = [
  {
    name: "weather",
    keywords: [
      "погода",
      "погоду",
      "погоди",
      "weather",
      "температура",
      "температуру",
      "температури",
      "temperature",
      "прогноз",
      "forecast",
      "спека",
      "мороз",
      "дощ",
      "сніг",
      "хмарно",
      "сонячно",
      "rain",
      "snow",
      "sunny",
      "cloudy",
      "градус",
      "celsius",
      "fahrenheit",
    ],
  },
  {
    name: "currency",
    keywords: [
      "курс",
      "валюта",
      "валюти",
      "валюту",
      "currency",
      "exchange",
      "rate",
      "долар",
      "доларів",
      "dollar",
      "usd",
      "євро",
      "euro",
      "eur",
      "гривня",
      "гривні",
      "hryvnia",
      "uah",
      "фунт",
      "pound",
      "gbp",
      "конвертер",
      "конвертація",
      "convert",
    ],
  },
  {
    name: "greeting",
    keywords: [
      "привіт",
      "hello",
      "hi",
      "hey",
      "вітаю",
      "добрий",
      "доброго",
      "доброго ранку",
      "good morning",
      "good evening",
      "хай",
    ],
  },
  {
    name: "help",
    keywords: [
      "допомога",
      "допоможи",
      "help",
      "що вмієш",
      "що ти вмієш",
      "команди",
      "commands",
      "можливості",
      "як користуватись",
    ],
  },
];

/**
 * Detect intent from a free-text message.
 * @param {string} text
 * @returns {{ intent: string|null, city: string|null }}
 */
function detectIntent(text) {
  const lower = text.toLowerCase();

  let intent = null;
  for (const { name, keywords } of INTENTS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      intent = name;
      break;
    }
  }

  // Try to extract a city name for weather intent
  // Patterns: "погода в Kyiv", "weather in London", "погода Kyiv"
  let city = null;
  if (intent === "weather") {
    const cityMatch = lower.match(
      /(?:погода|weather|прогноз|forecast)\s+(?:в|у|in|for)?\s*([a-zа-яіїєґ']+)/i,
    );
    if (cityMatch) city = cityMatch[1];
  }

  return { intent, city };
}

module.exports = { detectIntent };
