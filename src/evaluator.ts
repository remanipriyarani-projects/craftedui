import type { DateExpression, DateModifier } from "./types.js";

/**
 * Applies parsed modifiers in order. Each operation uses UTC date accessors so
 * results do not depend on the machine's local time zone or daylight-saving rules.
 */
export function evaluateExpression(expression: DateExpression, baseDate: Date): Date {
  if (!(baseDate instanceof Date) || Number.isNaN(baseDate.getTime())) {
    throw new TypeError("Base date must be a valid Date.");
  }

  const result = new Date(baseDate.getTime());
  for (const modifier of expression.modifiers) {
    applyModifier(result, modifier);
    if (Number.isNaN(result.getTime())) {
      throw new RangeError("Date calculation produced a value outside the supported date range.");
    }
  }
  return result;
}

function applyModifier(date: Date, modifier: DateModifier): void {
  const amount = modifier.operation === "add" ? modifier.amount : -modifier.amount;

  switch (modifier.unit) {
    case "s":
      date.setUTCSeconds(date.getUTCSeconds() + amount);
      break;
    case "m":
      date.setUTCMinutes(date.getUTCMinutes() + amount);
      break;
    case "h":
      date.setUTCHours(date.getUTCHours() + amount);
      break;
    case "d":
      date.setUTCDate(date.getUTCDate() + amount);
      break;
    case "mon":
      shiftUtcMonth(date, amount);
      break;
    case "y":
      shiftUtcYear(date, amount);
      break;
  }
}

// Clamp calendar shifts at month ends (for example, Jan 31 + 1 month = Feb 28).
function shiftUtcMonth(date: Date, amount: number): void {
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + amount);
  date.setUTCDate(Math.min(day, daysInUtcMonth(date.getUTCFullYear(), date.getUTCMonth())));
}

function shiftUtcYear(date: Date, amount: number): void {
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  date.setUTCDate(1);
  date.setUTCFullYear(date.getUTCFullYear() + amount);
  date.setUTCMonth(month);
  date.setUTCDate(Math.min(day, daysInUtcMonth(date.getUTCFullYear(), month)));
}

function daysInUtcMonth(year: number, month: number): number {
  const lastDay = new Date(0);
  lastDay.setUTCHours(0, 0, 0, 0);
  lastDay.setUTCFullYear(year, month + 1, 0);
  return lastDay.getUTCDate();
}
