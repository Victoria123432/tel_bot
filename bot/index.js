"use strict";

require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const { winstonLogger } = require("../middleware/logger");
const { detectIntent } = require("./nlp");
const { buildWeatherMessage, buildCurrencyMessage } = require("./messages");

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("  TELEGRAM_BOT_TOKEN is not set in .env");
  process.exit(1);
}

const bot = new Telegraf(token);

// ── Logging middleware ────────────────────────────────────────────────────────
bot.use(async (ctx, next) => {
  const user = ctx.from
    ? `${ctx.from.first_name || ""} ${ctx.from.last_name || ""} (@${ctx.from.username || ctx.from.id})`.trim()
    : "unknown";
  const text = ctx.message?.text || ctx.callbackQuery?.data || "";
  winstonLogger.info(`[BOT] ${user}: ${text}`);
  return next();
});

// ── /start ────────────────────────────────────────────────────────────────────
bot.start((ctx) => {
  const name = ctx.from?.first_name || "друже";
  ctx.replyWithMarkdown(
    ` Привіт, *${name}*!\n\n` +
      `Я — інформаційний бот. Ось що я вмію:\n\n` +
      ` /weather — погода у вказаному місті\n` +
      ` /currency — поточний курс валют\n` +
      ` /help — довідка\n\n` +
      `Або просто напиши мені, що тебе цікавить — наприклад:\n` +
      `_"погода в Kyiv"_ або _"курс долара"_`,
    Markup.keyboard([[" Погода", " Курс валют"], [" Допомога"]]).resize(),
  );
});

// ── /help ─────────────────────────────────────────────────────────────────────
bot.help((ctx) => {
  ctx.replyWithMarkdown(
    `*Доступні команди:*\n\n` +
      ` /weather \\<місто\\> — погода (наприклад: \`/weather Kyiv\`)\n` +
      ` /currency \\[валюти\\] — курс валют відносно EUR\n` +
      `   (наприклад: \`/currency USD UAH GBP\`)\n\n` +
      `*Вільний текст:*\n` +
      `Просто напиши що тебе цікавить — бот розпізнає запит автоматично.\n` +
      `Приклади: _"погода в Львів"_, _"курс євро"_`,
  );
});

// ── /weather <city> ───────────────────────────────────────────────────────────
bot.command("weather", async (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  const city = args.join(" ").trim();

  if (!city) {
    return ctx.reply(
      " Вкажи назву міста після команди.\nПриклад: /weather Kyiv",
    );
  }

  const loading = await ctx.reply(" Отримую дані про погоду…");

  try {
    const msg = await buildWeatherMessage(city);
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.replyWithMarkdown(msg);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    const apiErr = err.response?.data?.message;
    ctx.reply(
      apiErr
        ? ` Місто не знайдено: _${city}_. Перевір назву та спробуй ще раз.`
        : ` Не вдалося отримати погоду. Спробуй пізніше.`,
    );
    winstonLogger.error(`[BOT] /weather error: ${err.message}`);
  }
});

// ── /currency [SYM1 SYM2 ...] ────────────────────────────────────────────────
bot.command("currency", async (ctx) => {
  const args = ctx.message.text
    .split(/\s+/)
    .slice(1)
    .map((s) => s.toUpperCase());
  const symbols = args.length ? args : ["USD", "UAH", "GBP", "PLN", "CHF"];

  const loading = await ctx.reply(" Отримую курс валют…");

  try {
    const msg = await buildCurrencyMessage(symbols);
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.replyWithMarkdown(msg);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.reply(" Не вдалося отримати курс валют. Спробуй пізніше.");
    winstonLogger.error(`[BOT] /currency error: ${err.message}`);
  }
});

// ── Keyboard buttons ──────────────────────────────────────────────────────────
bot.hears(" Погода", (ctx) =>
  ctx.reply(" Вкажи місто:\nПриклад: /weather Kyiv"),
);

bot.hears(" Курс валют", async (ctx) => {
  const loading = await ctx.reply(" Отримую курс валют…");
  try {
    const msg = await buildCurrencyMessage();
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.replyWithMarkdown(msg);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.reply(" Не вдалося отримати курс валют.");
    winstonLogger.error(`[BOT] keyboard currency error: ${err.message}`);
  }
});

bot.hears(" Допомога", (ctx) =>
  bot.handleUpdate({
    ...ctx.update,
    message: { ...ctx.message, text: "/help" },
  }),
);

// ── Free-text NLP handler ─────────────────────────────────────────────────────
bot.on("text", async (ctx) => {
  let intent, city;
  try {
    ({ intent, city } = await detectIntent(ctx.message.text));
  } catch (err) {
    winstonLogger.error(`[BOT] NLP service error: ${err.message}`);
    return ctx.reply(
      "⚠️ NLP сервіс недоступний. Спробуй пізніше або використай команди /weather, /currency.",
    );
  }

  if (intent === "GREETING") {
    const name = ctx.from?.first_name || "";
    return ctx.reply(
      ` Привіт${name ? ", " + name : ""}! Чим можу допомогти?\nНапиши /help щоб побачити команди.`,
    );
  }

  if (intent === "HELP") {
    return bot.handleUpdate({
      ...ctx.update,
      message: { ...ctx.message, text: "/help" },
    });
  }

  if (intent === "WEATHER") {
    if (city) {
      // City detected in the message — fetch immediately
      const loading = await ctx.reply("⏳ Отримую дані про погоду…");
      try {
        const msg = await buildWeatherMessage(city);
        await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
        return ctx.replyWithMarkdown(msg);
      } catch {
        await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
        return ctx.reply(
          ` Не вдалося знайти місто "${city}". Спробуй /weather Kyiv`,
        );
      }
    }
    return ctx.reply(" Вкажи місто. Наприклад: /weather Kyiv");
  }

  if (intent === "CURRENCY") {
    const loading = await ctx.reply(" Отримую курс валют…");
    try {
      const msg = await buildCurrencyMessage();
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
      return ctx.replyWithMarkdown(msg);
    } catch {
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
      return ctx.reply(" Не вдалося отримати курс валют. Спробуй пізніше.");
    }
  }

  // No intent recognized
  ctx.reply(
    " Не зрозумів запит. Спробуй:\n" +
      "• /weather Kyiv — погода\n" +
      "• /currency — курс валют\n" +
      "• /help — усі команди",
  );
});

// ── Error handler ─────────────────────────────────────────────────────────────
bot.catch((err, ctx) => {
  winstonLogger.error(
    `[BOT] Unhandled error for update ${ctx.updateType}: ${err.message}`,
  );
});

module.exports = bot;
