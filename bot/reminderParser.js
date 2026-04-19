'use strict';

// Ukrainian month names → 0-based index
const MONTHS_UK = {
  'січня': 0, 'лютого': 1, 'березня': 2,  'квітня': 3,
  'травня': 4, 'червня': 5, 'липня': 6,   'серпня': 7,
  'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11,
};

/**
 * Returns true if the input looks like a reminder request.
 */
function isReminderRequest(input) {
  return /нагадай/i.test(input);
}

/**
 * Parse a natural-language reminder phrase.
 *
 * Supported patterns:
 *   "Нагадай мені завтра о 9:00 про зустріч"
 *   "Нагадай через 2 години зателефонувати"
 *   "Нагадай о 15:30 купити хліб"        (о may be Latin or Cyrillic)
 *   "Нагадай в 15:30 купити хліб"        (в instead of о)
 *   "Нагадай 25 квітня о 10:00 ..."
 *
 * @returns {{ remindAt: Date, text: string } | null}
 */
function parseReminder(input) {
  // Normalise: replace Latin o/O with Cyrillic о so regex hits consistently
  const normalised = input.replace(/\bo\b/gi, 'о');
  const lower      = normalised.toLowerCase().trim();
  const now        = new Date();

  // Strip trigger words to get the body for text extraction
  let body = normalised.replace(/^нагадай\s+(мені\s+)?/i, '').trim();

  let remindAt = null;

  // ── 1. Relative time: "через X хвилин|годин|днів" ──────────────────────────
  const relRe = /через\s+(\d+)\s+(хвилину|хвилини|хвилин|годину|години|годин|днів|дні|день)/;
  const relM  = lower.match(relRe);
  if (relM) {
    const val  = parseInt(relM[1], 10);
    const unit = relM[2];
    remindAt   = new Date(now);
    if (unit.startsWith('хвилин') || unit === 'хвилину') {
      remindAt.setMinutes(remindAt.getMinutes() + val);
    } else if (unit.startsWith('годин') || unit === 'годину') {
      remindAt.setHours(remindAt.getHours() + val);
    } else {
      remindAt.setDate(remindAt.getDate() + val);
    }
  }

  // ── 2. Absolute clock time: "[о|в] HH:MM" or "[о|в] HH ранку/вечора" ───────
  // Accepts Cyrillic о, в (both already normalised) and their latin look-alikes
  const timeRe = /[ов]\s+(\d{1,2})(?:[:\.\-](\d{2}))?(?:\s*(ранку|вечора|дня))?/;
  const timeM  = lower.match(timeRe);
  if (timeM) {
    let hours     = parseInt(timeM[1], 10);
    const minutes = timeM[2] ? parseInt(timeM[2], 10) : 0;
    const period  = timeM[3];

    if ((period === 'вечора' || period === 'дня') && hours < 12) hours += 12;

    if (!remindAt) {
      remindAt = new Date(now);

      // Determine date context
      if (lower.includes('після завтра') || lower.includes('післязавтра')) {
        remindAt.setDate(remindAt.getDate() + 2);
      } else if (lower.includes('завтра')) {
        remindAt.setDate(remindAt.getDate() + 1);
      } else {
        // Check for "DD місяць"
        let foundDate = false;
        for (const [monthName, monthIdx] of Object.entries(MONTHS_UK)) {
          const dateM = lower.match(new RegExp(`(\\d{1,2})\\s+${monthName}`));
          if (dateM) {
            remindAt  = new Date(now.getFullYear(), monthIdx, parseInt(dateM[1], 10));
            if (remindAt < now) remindAt.setFullYear(remindAt.getFullYear() + 1);
            foundDate = true;
            break;
          }
        }
        if (!foundDate) {
          remindAt = new Date(now);
        }
      }

      remindAt.setHours(hours, minutes, 0, 0);

      // If the resulting time is already in the past today → push to tomorrow
      if (remindAt <= now && !lower.includes('завтра') && !lower.includes('після')) {
        remindAt.setDate(remindAt.getDate() + 1);
      }
    } else {
      // Relative base time + specific clock → override hours
      remindAt.setHours(hours, minutes, 0, 0);
    }
  }

  if (!remindAt) return null;

  // ── 3. Extract reminder text ────────────────────────────────────────────────
  let text;

  // Prefer "про <text>" pattern
  const proM = body.match(/про\s+(.+)$/i);
  if (proM) {
    text = proM[1].trim();
  } else {
    text = body
      .replace(relRe, '')
      .replace(/[ов]\s+\d{1,2}(?:[:\.\-]\d{2})?(?:\s*(?:ранку|вечора|дня))?/i, '')
      .replace(/після\s*завтра/i, '')
      .replace(/завтра/i, '')
      .replace(/сьогодні/i, '');

    for (const monthName of Object.keys(MONTHS_UK)) {
      text = text.replace(new RegExp(`\\d{1,2}\\s+${monthName}`, 'i'), '');
    }

    text = text.replace(/\s{2,}/g, ' ').replace(/^[\s,]+|[\s,]+$/g, '').trim();
  }

  return { remindAt, text: text || 'нагадування' };
}

/**
 * Format a Date as "DD.MM.YYYY о HH:MM".
 */
function formatDateTime(date) {
  const d   = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} о ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

module.exports = { isReminderRequest, parseReminder, formatDateTime };
