import { evaluateExpression } from "./evaluator.js";
import { parseExpression } from "./parser.js";

/**
 * Evaluates a UTC date expression against the supplied date, or the current
 * instant when no base date is provided. The input date is never mutated.
 */
export function parse(expression: string, baseDate: Date = new Date()): Date {
  return evaluateExpression(parseExpression(expression), baseDate);
}

export { evaluateExpression } from "./evaluator.js";
export { parseExpression } from "./parser.js";
export type { DateExpression, DateModifier, Operation, TimeUnit } from "./types.js";
