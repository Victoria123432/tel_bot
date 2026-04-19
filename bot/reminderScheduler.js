'use strict';

const cron = require('node-cron');
const { getAllPending, markSent }   = require('../services/reminderService');
const { winstonLogger }             = require('../middleware/logger');

/**
 * Start the reminder scheduler.
 * Checks every minute for due reminders and sends them via the bot.
 *
 * @param {import('telegraf').Telegraf} bot
 */
function startScheduler(bot) {
  cron.schedule('* * * * *', async () => {
    const now     = new Date();
    const pending = getAllPending();

    for (const reminder of pending) {
      if (new Date(reminder.remindAt) <= now) {
        try {
          await bot.telegram.sendMessage(
            reminder.telegramId,
            `🔔 *Нагадування:* ${reminder.text}`,
            { parse_mode: 'Markdown' },
          );
          markSent(reminder.id);
          winstonLogger.info(`[Reminder] Sent id=${reminder.id} to telegramId=${reminder.telegramId}`);
        } catch (err) {
          winstonLogger.error(`[Reminder] Failed to send id=${reminder.id}: ${err.message}`);
        }
      }
    }
  });

  winstonLogger.info('[Reminder] Scheduler started (checks every minute)');
}

module.exports = { startScheduler };
