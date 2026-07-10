import { FUNCTIONS } from './functions';
import { parseCellRef, parseRangeRef, resolveRef, expandRange } from './references';
import { cellKey, toAddress } from '../utils/cellAddress';

export type CellValue = number | string | boolean | null;
export type GetCellValue = (row: number, col: number) => CellValue;
export type GetCellRaw = (row: number, col: number) => string;

const TOKEN_RE =
  /("(?:[^"\\]|\\.)*")|(\$?[A-Za-z]+\$?\d+:\$?[A-Za-z]+\$?\d+)|(\$?[A-Za-z]+\$?\d+)|([A-Za-z_][A-Za-z0-9_]*)|(\d+\.?\d*)|([+\-*/^<>=!&|(),])|(\s+)/g;

interface Token {
  type: string;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE.source, 'g');
  while ((m = re.exec(input)) !== null) {
    if (m[1]) tokens.push({ type: 'STRING', value: m[1].slice(1, -1) });
    else if (m[2]) tokens.push({ type: 'RANGE', value: m[2] });
    else if (m[3]) tokens.push({ type: 'CELL', value: m[3] });
    else if (m[4]) tokens.push({ type: 'IDENT', value: m[4] });
    else if (m[5]) tokens.push({ type: 'NUMBER', value: m[5] });
    else if (m[6]) tokens.push({ type: 'OP', value: m[6] });
    else if (m[7] && m[7].trim()) continue;
  }
  return tokens;
}

class Parser {
  private tokens: Token[];
  private pos = 0;
  private row: number;
  private col: number;
  private getValue: GetCellValue;
  private getRaw: GetCellRaw;
  private visiting = new Set<string>();

  constructor(
    tokens: Token[],
    row: number,
    col: number,
    getValue: GetCellValue,
    getRaw: GetCellRaw,
  ) {
    this.tokens = tokens;
    this.row = row;
    this.col = col;
    this.getValue = getValue;
    this.getRaw = getRaw;
  }

  private peek(): Token | null {
    return this.tokens[this.pos] ?? null;
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: string, value?: string): Token {
    const t = this.consume();
    if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error(`Expected ${type}${value ? ' ' + value : ''}`);
    }
    return t;
  }

  parse(): CellValue {
    if (!this.tokens.length) return null;
    const result = this.parseExpr();
    return result;
  }

  private parseExpr(): CellValue {
    return this.parseComparison();
  }

  private parseComparison(): CellValue {
    let left = this.parseConcat();
    while (this.peek()?.type === 'OP' && ['<', '>', '<=', '>=', '=', '<>'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseConcat();
      const l = left;
      const r = right;
      if (op === '<') left = toCompare(l) < toCompare(r);
      else if (op === '>') left = toCompare(l) > toCompare(r);
      else if (op === '<=') left = toCompare(l) <= toCompare(r);
      else if (op === '>=') left = toCompare(l) >= toCompare(r);
      else if (op === '=') left = String(l) === String(r) || toCompare(l) === toCompare(r);
      else if (op === '<>') left = String(l) !== String(r) && toCompare(l) !== toCompare(r);
    }
    return left;
  }

  private parseConcat(): CellValue {
    let left = this.parseAdd();
    while (this.peek()?.type === 'OP' && this.peek()!.value === '&') {
      this.consume();
      const right = this.parseAdd();
      left = String(left ?? '') + String(right ?? '');
    }
    return left;
  }

  private parseAdd(): CellValue {
    let left = this.parseMul();
    while (this.peek()?.type === 'OP' && (this.peek()!.value === '+' || this.peek()!.value === '-')) {
      const op = this.consume().value;
      const right = this.parseMul();
      left = op === '+' ? toNum(left) + toNum(right) : toNum(left) - toNum(right);
    }
    return left;
  }

  private parseMul(): CellValue {
    let left = this.parsePow();
    while (this.peek()?.type === 'OP' && (this.peek()!.value === '*' || this.peek()!.value === '/')) {
      const op = this.consume().value;
      const right = this.parsePow();
      left = op === '*' ? toNum(left) * toNum(right) : toNum(left) / toNum(right);
    }
    return left;
  }

  private parsePow(): CellValue {
    let left = this.parseUnary();
    while (this.peek()?.type === 'OP' && this.peek()!.value === '^') {
      this.consume();
      const right = this.parseUnary();
      left = Math.pow(toNum(left), toNum(right));
    }
    return left;
  }

  private parseUnary(): CellValue {
    if (this.peek()?.type === 'OP' && this.peek()!.value === '-') {
      this.consume();
      return -toNum(this.parseUnary());
    }
    if (this.peek()?.type === 'OP' && this.peek()!.value === '+') {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): CellValue {
    const t = this.peek();
    if (!t) throw new Error('Unexpected end');

    if (t.type === 'NUMBER') {
      this.consume();
      return parseFloat(t.value);
    }
    if (t.type === 'STRING') {
      this.consume();
      return t.value;
    }
    if (t.type === 'CELL') {
      this.consume();
      return this.resolveCell(t.value);
    }
    if (t.type === 'RANGE') {
      this.consume();
      return this.resolveRange(t.value);
    }
    if (t.type === 'IDENT') {
      const name = t.value.toUpperCase();
      if (name === 'TRUE') { this.consume(); return true; }
      if (name === 'FALSE') { this.consume(); return false; }
      if (FUNCTIONS[name]) {
        this.consume();
        this.expect('OP', '(');
        const args = this.parseArgs();
        this.expect('OP', ')');
        return FUNCTIONS[name](...args) as CellValue;
      }
      throw new Error(`Unknown identifier: ${t.value}`);
    }
    if (t.type === 'OP' && t.value === '(') {
      this.consume();
      const val = this.parseExpr();
      this.expect('OP', ')');
      return val;
    }
    throw new Error(`Unexpected token: ${t.value}`);
  }

  private parseArgs(): (number | string | boolean)[] {
    const args: (number | string | boolean)[] = [];
    if (this.peek()?.type === 'OP' && this.peek()!.value === ')') return args;

    while (true) {
      if (this.peek()?.type === 'RANGE') {
        const rangeVal = this.resolveRangeAsArray(this.consume().value);
        args.push(...rangeVal);
      } else {
        const val = this.parseExpr();
        args.push(val as number | string | boolean);
      }
      if (this.peek()?.type === 'OP' && this.peek()!.value === ',') {
        this.consume();
        continue;
      }
      break;
    }
    return args;
  }

  private resolveCell(ref: string): CellValue {
    const parsed = parseCellRef(ref);
    if (!parsed) return '#REF!';
    const { row, col } = resolveRef(parsed, this.row, this.col);
    const key = cellKey(row, col);
    if (this.visiting.has(key)) return '#CIRC!';
    this.visiting.add(key);
    try {
      const raw = this.getRaw(row, col);
      if (raw.startsWith('=')) {
        return evaluateFormula(raw, row, col, this.getValue, this.getRaw, this.visiting);
      }
      if (raw === '') return null;
      const num = parseFloat(raw);
      return isNaN(num) ? raw : num;
    } finally {
      this.visiting.delete(key);
    }
  }

  private resolveRange(ref: string): CellValue {
    const vals = this.resolveRangeAsArray(ref);
    if (vals.length === 1) return vals[0];
    return vals.reduce((a, b) => toNum(a) + toNum(b), 0);
  }

  private resolveRangeAsArray(ref: string): (number | string | boolean)[] {
    const range = parseRangeRef(ref);
    if (!range) return [];
    const cells = expandRange(range, this.row, this.col);
    const vals: (number | string | boolean)[] = [];
    for (const { row, col } of cells) {
      const v = this.resolveCell(toAddress(row, col));
      if (v !== null && v !== '') vals.push(v as number | string | boolean);
    }
    return vals;
  }
}

function toNum(v: CellValue): number {
  if (v === null || v === '') return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = parseFloat(String(v));
  return isNaN(n) ? 0 : n;
}

function toCompare(v: CellValue): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const n = parseFloat(String(v ?? ''));
  return isNaN(n) ? 0 : n;
}

export function evaluateFormula(
  formula: string,
  row: number,
  col: number,
  getValue: GetCellValue,
  getRaw: GetCellRaw,
  visiting: Set<string> = new Set(),
): CellValue {
  const expr = formula.startsWith('=') ? formula.slice(1) : formula;
  if (!expr.trim()) return null;
  try {
    const tokens = tokenize(expr);
    const parser = new Parser(tokens, row, col, getValue, getRaw);
    parser['visiting'] = visiting;
    return parser.parse();
  } catch {
    return '#ERROR!';
  }
}

export function computeCellValue(
  raw: string,
  row: number,
  col: number,
  getRaw: GetCellRaw,
): CellValue {
  if (!raw) return null;
  if (raw.startsWith('=')) {
    const getValue = (r: number, c: number) => {
      const rRaw = getRaw(r, c);
      return computeCellValue(rRaw, r, c, getRaw);
    };
    return evaluateFormula(raw, row, col, getValue, getRaw);
  }
  const num = parseFloat(raw);
  if (!isNaN(num) && raw.trim() === String(num)) return num;
  return raw;
}

export function formatDisplayValue(
  value: CellValue,
  numberFormat: string = 'general',
  decimalPlaces: number = 2,
): string {
  if (value === null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'string' && value.startsWith('#')) return value;

  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num) || numberFormat === 'general') {
    return String(value);
  }
  switch (numberFormat) {
    case 'number':
      return num.toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
    case 'currency':
      return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
    case 'percent':
      return (num * 100).toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }) + '%';
    default:
      return String(value);
  }
}
