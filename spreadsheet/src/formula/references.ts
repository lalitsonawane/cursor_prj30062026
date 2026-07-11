import { letterToCol } from '../utils/cellAddress';

export interface CellRef {
  row: number;
  col: number;
  rowAbs: boolean;
  colAbs: boolean;
}

export interface RangeRef {
  start: CellRef;
  end: CellRef;
}

const CELL_REF_RE = /^(\$?)([A-Za-z]+)(\$?)(\d+)$/;

export function parseCellRef(ref: string): CellRef | null {
  const match = ref.match(CELL_REF_RE);
  if (!match) return null;
  return {
    colAbs: match[1] === '$',
    col: letterToCol(match[2]),
    rowAbs: match[3] === '$',
    row: parseInt(match[4], 10) - 1,
  };
}

export function resolveRef(ref: CellRef, baseRow: number, baseCol: number): { row: number; col: number } {
  return {
    row: ref.rowAbs ? ref.row : baseRow + (ref.row - baseRow),
    col: ref.colAbs ? ref.col : baseCol + (ref.col - baseCol),
  };
}

export function adjustRef(ref: CellRef, dRow: number, dCol: number): CellRef {
  return {
    rowAbs: ref.rowAbs,
    colAbs: ref.colAbs,
    row: ref.rowAbs ? ref.row : ref.row + dRow,
    col: ref.colAbs ? ref.col : ref.col + dCol,
  };
}

export function formatCellRef(ref: CellRef): string {
  const col = ref.col;
  let letters = '';
  let c = col;
  while (c >= 0) {
    letters = String.fromCharCode(65 + (c % 26)) + letters;
    c = Math.floor(c / 26) - 1;
  }
  return `${ref.colAbs ? '$' : ''}${letters}${ref.rowAbs ? '$' : ''}${ref.row + 1}`;
}

export function parseRangeRef(range: string): RangeRef | null {
  const parts = range.split(':');
  if (parts.length !== 2) return null;
  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return null;
  return { start, end };
}

export function expandRange(range: RangeRef, baseRow: number, baseCol: number): { row: number; col: number }[] {
  const s = resolveRef(range.start, baseRow, baseCol);
  const e = resolveRef(range.end, baseRow, baseCol);
  const cells: { row: number; col: number }[] = [];
  const minRow = Math.min(s.row, e.row);
  const maxRow = Math.max(s.row, e.row);
  const minCol = Math.min(s.col, e.col);
  const maxCol = Math.max(s.col, e.col);
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}
