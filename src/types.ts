export type TimeUnit = "s" | "m" | "h" | "d" | "mon" | "y";
export type Operation = "add" | "subtract";

export interface DateModifier {
  readonly operation: Operation;
  readonly amount: number;
  readonly unit: TimeUnit;
}

export interface DateExpression {
  readonly modifiers: readonly DateModifier[];
}
