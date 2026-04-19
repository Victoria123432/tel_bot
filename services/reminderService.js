'use strict';

const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'reminders.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
  // Strip UTF-8 BOM if present (created by some editors/PowerShell Out-File)
  const raw = fs.readFileSync(DATA_FILE, 'utf8').replace(/^\uFEFF/, '');
  try {
    return JSON.parse(raw);
  } catch {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    return [];
  }
}

function save(reminders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2), 'utf8');
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Create a new reminder.
 * @param {string|number} telegramId
 * @param {{ text: string, remindAt: Date }} data
 */
function createReminder(telegramId, { text, remindAt }) {
  const reminders = load();
  const reminder  = {
    id:         Date.now(),
    telegramId: String(telegramId),
    text,
    remindAt:   new Date(remindAt).toISOString(),
    sent:       false,
    createdAt:  new Date().toISOString(),
  };
  reminders.push(reminder);
  save(reminders);
  return reminder;
}

/**
 * Get all active (not yet sent) reminders for a user.
 */
function getReminders(telegramId) {
  return load().filter(
    (r) => r.telegramId === String(telegramId) && !r.sent,
  );
}

/**
 * Get all pending reminders across all users (used by scheduler).
 */
function getAllPending() {
  return load().filter((r) => !r.sent);
}

/**
 * Mark a reminder as sent.
 */
function markSent(id) {
  const reminders = load();
  const r = reminders.find((x) => x.id === Number(id));
  if (r) {
    r.sent = true;
    save(reminders);
  }
}

/**
 * Delete a reminder by id (only if it belongs to the given user).
 * Returns true if deleted.
 */
function deleteReminder(telegramId, id) {
  const reminders = load();
  const before    = reminders.length;
  const filtered  = reminders.filter(
    (r) => !(r.telegramId === String(telegramId) && r.id === Number(id)),
  );
  save(filtered);
  return filtered.length < before;
}

module.exports = { createReminder, getReminders, getAllPending, markSent, deleteReminder };
