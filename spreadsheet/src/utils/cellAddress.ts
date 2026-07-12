const COL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function colToLetter(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = COL_LETTERS[c % 26] + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

export function letterToCol(letter: string): number {
  const upper = letter.toUpperCase();
  let col = 0;
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64);
  }
  return col - 1;
}

export function toAddress(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`;
}

export function fromAddress(address: string): { row: number; col: number } | null {
  const match = address.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) return null;
  return { col: letterToCol(match[1]), row: parseInt(match[2], 10) - 1 };
}

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function parseCellKey(key: string): { row: number; col: number } {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

export function normalizeSelection(sel: { startRow: number; startCol: number; endRow: number; endCol: number }) {
  return {
    startRow: Math.min(sel.startRow, sel.endRow),
    startCol: Math.min(sel.startCol, sel.endCol),
    endRow: Math.max(sel.startRow, sel.endRow),
    endCol: Math.max(sel.startCol, sel.endCol),
  };
}

export function isInSelection(row: number, col: number, sel: { startRow: number; startCol: number; endRow: number; endCol: number }): boolean {
  const n = normalizeSelection(sel);
  return row >= n.startRow && row <= n.endRow && col >= n.startCol && col <= n.endCol;
}
