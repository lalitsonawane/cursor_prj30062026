type Fn = (...args: (number | string | boolean)[]) => number | string | boolean;

function toNum(v: number | string | boolean): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function flattenNums(args: (number | string | boolean)[]): number[] {
  return args.map(toNum);
}

export const FUNCTIONS: Record<string, Fn> = {
  SUM: (...args) => flattenNums(args).reduce((a, b) => a + b, 0),
  AVERAGE: (...args) => {
    const nums = flattenNums(args);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  },
  AVG: (...args) => FUNCTIONS.AVERAGE(...args),
  MIN: (...args) => (flattenNums(args).length ? Math.min(...flattenNums(args)) : 0),
  MAX: (...args) => (flattenNums(args).length ? Math.max(...flattenNums(args)) : 0),
  COUNT: (...args) => flattenNums(args).filter((n) => !isNaN(n)).length,
  COUNTA: (...args) => args.filter((a) => a !== '' && a !== null && a !== undefined).length,
  PRODUCT: (...args) => flattenNums(args).reduce((a, b) => a * b, 1),
  ABS: (n) => Math.abs(toNum(n)),
  ROUND: (n, digits = 0) => {
    const f = Math.pow(10, toNum(digits));
    return Math.round(toNum(n) * f) / f;
  },
  FLOOR: (n) => Math.floor(toNum(n)),
  CEIL: (n) => Math.ceil(toNum(n)),
  CEILING: (n) => Math.ceil(toNum(n)),
  SQRT: (n) => Math.sqrt(toNum(n)),
  POWER: (base, exp) => Math.pow(toNum(base), toNum(exp)),
  POW: (base, exp) => Math.pow(toNum(base), toNum(exp)),
  MOD: (n, d) => toNum(n) % toNum(d),
  IF: (cond, t, f) => (cond ? t : f) as number | string | boolean,
  AND: (...args) => args.every(Boolean),
  OR: (...args) => args.some(Boolean),
  NOT: (v) => !v,
  CONCATENATE: (...args) => args.map(String).join(''),
  CONCAT: (...args) => args.map(String).join(''),
  LEN: (s) => String(s).length,
  UPPER: (s) => String(s).toUpperCase(),
  LOWER: (s) => String(s).toLowerCase(),
  TRIM: (s) => String(s).trim(),
  LEFT: (s, n) => String(s).slice(0, toNum(n)),
  RIGHT: (s, n) => String(s).slice(-toNum(n)),
  MID: (s, start, len) => String(s).slice(toNum(start) - 1, toNum(start) - 1 + toNum(len)),
  INT: (n) => Math.trunc(toNum(n)),
  MEDIAN: (...args) => {
    const sorted = flattenNums(args).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },
};
