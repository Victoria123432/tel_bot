'use strict';

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg }    = require('@prisma/adapter-pg');
const { winstonLogger } = require('../middleware/logger');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter });

/**
 * Find a user by Telegram ID.
 * Returns null if not found.
 */
async function findUser(telegramId) {
  return prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
}

/**
 * Find user or create a new profile with defaults.
 * Called on every interaction to ensure the user exists in DB.
 */
async function upsertUser(telegramId, { firstName, username } = {}) {
  const user = await prisma.user.upsert({
    where:  { telegramId: BigInt(telegramId) },
    update: { firstName: firstName || undefined, username: username || undefined },
    create: {
      telegramId: BigInt(telegramId),
      firstName:  firstName  || null,
      username:   username   || null,
      language:   'uk',
    },
  });
  winstonLogger.info(`[DB] upsert user telegramId=${telegramId}`);
  return user;
}

/**
 * Update user's favorite city.
 */
async function setCity(telegramId, city) {
  return prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data:  { city },
  });
}

/**
 * Update user's language preference.
 * @param {string} lang - 'uk' | 'en'
 */
async function setLanguage(telegramId, lang) {
  return prisma.user.update({
    where: { telegramId: BigInt(telegramId) },
    data:  { language: lang },
  });
}

module.exports = { findUser, upsertUser, setCity, setLanguage };
