import type { DateExpression, DateModifier, TimeUnit } from "./types.js";

const UNIT_PATTERN = /^(s|m|h|d|mon|y)$/;
const MODIFIER_PATTERN = /^([+-])(\d+)([A-Za-z]+)/;
const VALID_MODIFIER_PATTERN = /^([+-])(\d+)(mon|[smhdy])/;

/**
 * Parses the deliberately small expression grammar without consulting the clock.
 * The evaluator is responsible for applying the resulting modifiers to a date.
 */
export function parseExpression(expression: string): DateExpression {
  if (typeof expression !== "string") {
    throw new TypeError("Date expression must be a string.");
  }
  if (expression.length === 0) {
    throw new SyntaxError("Date expression must not be empty.");
  }
  if (!expression.startsWith("now()")) {
    throw new SyntaxError('Date expression must start with "now()".');
  }

  const modifiers: DateModifier[] = [];
  let position = "now()".length;

  while (position < expression.length) {
    const remaining = expression.slice(position);
    const modifierMatch = VALID_MODIFIER_PATTERN.exec(remaining);

    if (!modifierMatch) {
      const unknownUnitMatch = MODIFIER_PATTERN.exec(remaining);
      const unknownUnit = unknownUnitMatch?.[3];
      if (unknownUnit && !UNIT_PATTERN.test(unknownUnit)) {
        throw new SyntaxError(`Unsupported time unit "${unknownUnit}".`);
      }
      throw new SyntaxError(`Invalid modifier at position ${position}: "${remaining}".`);
    }

    const [, sign, amountText, unitText] = modifierMatch;
    if (!isTimeUnit(unitText)) {
      throw new SyntaxError(`Unsupported time unit "${unitText}".`);
    }
    const amount = Number(amountText);
    if (!Number.isSafeInteger(amount)) {
      throw new RangeError(`Modifier amount "${amountText}" is outside the safe integer range.`);
    }

    modifiers.push({
      operation: sign === "+" ? "add" : "subtract",
      amount,
      unit: unitText,
    });
    position += modifierMatch[0].length;
  }

  return { modifiers };
}

function isTimeUnit(value: string | undefined): value is TimeUnit {
  return value !== undefined && UNIT_PATTERN.test(value);
}
