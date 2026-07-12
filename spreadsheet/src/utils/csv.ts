import Papa from 'papaparse';
import type { Sheet, CellData } from '../types';
import { DEFAULT_FORMAT } from '../types';
import { cellKey } from './cellAddress';

export function exportToCsv(sheet: Sheet): string {
  const maxRow = findMaxRow(sheet);
  const maxCol = findMaxCol(sheet);
  const rows: string[][] = [];
  for (let r = 0; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      row.push(sheet.cells[cellKey(r, c)]?.raw ?? '');
    }
    rows.push(row);
  }
  return Papa.unparse(rows);
}

export function importFromCsv(text: string): Record<string, CellData> {
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false });
  const cells: Record<string, CellData> = {};
  parsed.data.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val !== '') {
        cells[cellKey(r, c)] = { raw: val, format: { ...DEFAULT_FORMAT } };
      }
    });
  });
  return cells;
}

function findMaxRow(sheet: Sheet): number {
  let max = 0;
  for (const key of Object.keys(sheet.cells)) {
    const r = parseInt(key.split(',')[0], 10);
    if (r > max) max = r;
  }
  return max;
}

function findMaxCol(sheet: Sheet): number {
  let max = 0;
  for (const key of Object.keys(sheet.cells)) {
    const c = parseInt(key.split(',')[1], 10);
    if (c > max) max = c;
  }
  return max;
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
