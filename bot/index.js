'use strict';

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { winstonLogger }    = require('../middleware/logger');
const { detectIntent }     = require('./nlp');
const { buildWeatherMessage, buildCurrencyMessage } = require('./messages');
const { upsertUser, setCity, setLanguage } = require('../services/userService');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌  TELEGRAM_BOT_TOKEN is not set in .env');
  process.exit(1);
}

const bot = new Telegraf(token);

// ── Logging + profile sync middleware ────────────────────────────────────────
bot.use(async (ctx, next) => {
  if (ctx.from) {
    const logName = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''} (@${ctx.from.username || ctx.from.id})`.trim();
    const text = ctx.message?.text || ctx.callbackQuery?.data || '';
    winstonLogger.info(`[BOT] ${logName}: ${text}`);

    // Upsert user profile on every interaction (identification)
    await upsertUser(ctx.from.id, {
      firstName: ctx.from.first_name,
      username:  ctx.from.username,
    });
  }
  return next();
});

// ── /start ────────────────────────────────────────────────────────────────────
bot.start((ctx) => {
  const name = ctx.from?.first_name || 'друже';
  ctx.replyWithMarkdown(
    `👋 Привіт, *${name}*!\n\n` +
    `Я — інформаційний бот. Ось що я вмію:\n\n` +
    `🌤 /weather — погода у вказаному місті\n` +
    `💱 /currency — поточний курс валют\n` +
    `⚙️ /settings — мої налаштування\n` +
    `❓ /help — довідка\n\n` +
    `Або просто напиши мені, що тебе цікавить — наприклад:\n` +
    `_"погода в Kyiv"_ або _"курс долара"_`,
    Markup.keyboard([
      ['🌤 Погода', '💱 Курс валют'],
      ['⚙️ Налаштування', '❓ Допомога'],
    ]).resize(),
  );
});

// ── /help ─────────────────────────────────────────────────────────────────────
bot.help((ctx) => {
  ctx.replyWithMarkdown(
    `*Доступні команди:*\n\n` +
    `🌤 /weather \\[місто\\] — погода (якщо місто не вказано — використовується збережене)\n` +
    `💱 /currency \\[валюти\\] — курс валют відносно EUR\n` +
    `⚙️ /settings — переглянути профіль\n` +
    `🏙 /setcity \\<місто\\> — зберегти улюблене місто\n` +
    `🌐 /setlang \\<uk|en\\> — мова відповіді\n\n` +
    `*Вільний текст:*\n` +
    `Просто напиши що тебе цікавить — бот розпізнає запит автоматично.\n` +
    `Приклади: _"погода в Львів"_, _"курс євро"_`,
  );
});

// ── /settings — show user profile ────────────────────────────────────────────
bot.command('settings', async (ctx) => {
  const { findUser } = require('../services/userService');
  const user = await findUser(ctx.from.id);

  if (!user) return ctx.reply('Профіль не знайдено.');

  ctx.replyWithMarkdown(
    `⚙️ *Твій профіль:*\n\n` +
    `👤 Ім'я: ${user.firstName || '—'}\n` +
    `🔖 Username: ${user.username ? '@' + user.username : '—'}\n` +
    `🏙 Улюблене місто: ${user.city || '_не задано_'}\n` +
    `🌐 Мова: ${user.language === 'uk' ? '🇺🇦 Українська' : '🇬🇧 English'}\n\n` +
    `_Зміни: /setcity, /setlang_`,
  );
});

// ── /setcity <city> ───────────────────────────────────────────────────────────
bot.command('setcity', async (ctx) => {
  const city = ctx.message.text.split(/\s+/).slice(1).join(' ').trim();

  if (!city) {
    return ctx.reply('🏙 Вкажи назву міста.\nПриклад: /setcity Kyiv');
  }

  await setCity(ctx.from.id, city);
  ctx.reply(`✅ Улюблене місто збережено: *${city}*\n\nТепер /weather покаже погоду для ${city} автоматично.`, { parse_mode: 'Markdown' });
});

// ── /setlang <uk|en> ─────────────────────────────────────────────────────────
bot.command('setlang', async (ctx) => {
  const lang = ctx.message.text.split(/\s+/)[1]?.toLowerCase();

  if (!['uk', 'en'].includes(lang)) {
    return ctx.reply('🌐 Доступні мови: uk (українська), en (англійська)\nПриклад: /setlang uk');
  }

  await setLanguage(ctx.from.id, lang);
  ctx.reply(`✅ Мову збережено: ${lang === 'uk' ? '🇺🇦 Українська' : '🇬🇧 English'}`);
});

// ── /weather [city] ───────────────────────────────────────────────────────────
bot.command('weather', async (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  let city = args.join(' ').trim();

  // Personalization: use saved city if not specified
  if (!city) {
    const { findUser } = require('../services/userService');
    const user = await findUser(ctx.from.id);
    city = user?.city || '';
  }

  if (!city) {
    return ctx.reply(
      '🏙 Вкажи місто або збережи його командою /setcity Kyiv\nПриклад: /weather Kyiv',
    );
  }

  const loading = await ctx.reply('⏳ Отримую дані про погоду…');

  try {
    // Use saved language preference
    const { findUser } = require('../services/userService');
    const user = await findUser(ctx.from.id);
    const lang = user?.language || 'uk';

    const msg = await buildWeatherMessage(city, 'metric', lang);
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.replyWithMarkdown(msg);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    const apiErr = err.response?.data?.message;
    ctx.reply(apiErr
      ? `❌ Місто не знайдено: _${city}_. Перевір назву та спробуй ще раз.`
      : `⚠️ Не вдалося отримати погоду. Спробуй пізніше.`);
    winstonLogger.error(`[BOT] /weather error: ${err.message}`);
  }
});

// ── /currency [SYM1 SYM2 ...] ────────────────────────────────────────────────
bot.command('currency', async (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1).map((s) => s.toUpperCase());
  const symbols = args.length ? args : ['USD', 'UAH', 'GBP', 'PLN', 'CHF'];

  const loading = await ctx.reply('⏳ Отримую курс валют…');

  try {
    const msg = await buildCurrencyMessage(symbols);
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.replyWithMarkdown(msg);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.reply('⚠️ Не вдалося отримати курс валют. Спробуй пізніше.');
    winstonLogger.error(`[BOT] /currency error: ${err.message}`);
  }
});

// ── Keyboard buttons ──────────────────────────────────────────────────────────
bot.hears('🌤 Погода', async (ctx) => {
  const { findUser } = require('../services/userService');
  const user = await findUser(ctx.from.id);
  if (user?.city) {
    const loading = await ctx.reply('⏳ Отримую дані про погоду…');
    try {
      const msg = await buildWeatherMessage(user.city, 'metric', user.language || 'uk');
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
      return ctx.replyWithMarkdown(msg);
    } catch {
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    }
  }
  ctx.reply('🏙 Вкажи місто:\nПриклад: /weather Kyiv\nАбо збережи улюблене: /setcity Kyiv');
});

bot.hears('💱 Курс валют', async (ctx) => {
  const loading = await ctx.reply('⏳ Отримую курс валют…');
  try {
    const msg = await buildCurrencyMessage();
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.replyWithMarkdown(msg);
  } catch (err) {
    await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
    ctx.reply('⚠️ Не вдалося отримати курс валют.');
    winstonLogger.error(`[BOT] keyboard currency error: ${err.message}`);
  }
});

bot.hears('⚙️ Налаштування', (ctx) =>
  bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/settings' } }),
);

bot.hears('❓ Допомога', (ctx) =>
  bot.handleUpdate({ ...ctx.update, message: { ...ctx.message, text: '/help' } }),
);

// ── Free-text NLP handler ─────────────────────────────────────────────────────
bot.on('text', async (ctx) => {
  let intent, city;
  try {
    ({ intent, city } = await detectIntent(ctx.message.text));
  } catch (err) {
    winstonLogger.error(`[BOT] NLP service error: ${err.message}`);
    return ctx.reply('⚠️ NLP сервіс недоступний. Спробуй пізніше або використай команди /weather, /currency.');
  }

  if (intent === 'GREETING') {
    const name = ctx.from?.first_name || '';
    return ctx.reply(`👋 Привіт${name ? ', ' + name : ''}! Чим можу допомогти?\nНапиши /help щоб побачити команди.`);
  }

  if (intent === 'WEATHER') {
    // Use NER city from NLP; fall back to saved city
    let targetCity = city;
    if (!targetCity) {
      const { findUser } = require('../services/userService');
      const user = await findUser(ctx.from.id);
      targetCity = user?.city || null;
    }

    if (targetCity) {
      const loading = await ctx.reply('⏳ Отримую дані про погоду…');
      try {
        const { findUser } = require('../services/userService');
        const user = await findUser(ctx.from.id);
        const msg = await buildWeatherMessage(targetCity, 'metric', user?.language || 'uk');
        await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
        return ctx.replyWithMarkdown(msg);
      } catch {
        await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
        return ctx.reply(`❌ Не вдалося знайти місто "${targetCity}". Спробуй /weather Kyiv`);
      }
    }
    return ctx.reply('🏙 Вкажи місто. Наприклад: /weather Kyiv\nАбо збережи улюблене: /setcity Kyiv');
  }

  if (intent === 'CURRENCY') {
    const loading = await ctx.reply('⏳ Отримую курс валют…');
    try {
      const msg = await buildCurrencyMessage();
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
      return ctx.replyWithMarkdown(msg);
    } catch {
      await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);
      return ctx.reply('⚠️ Не вдалося отримати курс валют. Спробуй пізніше.');
    }
  }

  ctx.reply(
    '🤔 Не зрозумів запит. Спробуй:\n' +
    '• /weather Kyiv — погода\n' +
    '• /currency — курс валют\n' +
    '• /help — усі команди',
  );
});

// ── Error handler ─────────────────────────────────────────────────────────────
bot.catch((err, ctx) => {
  winstonLogger.error(`[BOT] Unhandled error for update ${ctx.updateType}: ${err.message}`);
});

module.exports = bot;
