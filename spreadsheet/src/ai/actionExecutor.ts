import { fromAddress, normalizeSelection } from '../utils/cellAddress';
import { computeCellValue } from '../formula/evaluator';
import type { AiAction } from './types';
import type { CellFormat } from '../types';
import { useSpreadsheetStore } from '../store/spreadsheetStore';

export function executeAiActions(actions: AiAction[]): string[] {
  const store = useSpreadsheetStore.getState();
  const applied: string[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'set_cell': {
          if (!action.address || action.value === undefined) break;
          const pos = fromAddress(action.address);
          if (!pos) break;
          store.setCell(pos.row, pos.col, action.value, false);
          applied.push(`Set ${action.address} = ${action.value}`);
          break;
        }
        case 'set_cells': {
          if (!action.values?.length) break;
          const batch = action.values
            .map((v) => {
              const pos = fromAddress(v.address);
              return pos ? { row: pos.row, col: pos.col, raw: v.value } : null;
            })
            .filter(Boolean) as { row: number; col: number; raw: string }[];
          store.setCellsBatch(batch);
          applied.push(`Set ${batch.length} cells`);
          break;
        }
        case 'format_range': {
          if (!action.range || !action.format) break;
          const range = parseRange(action.range);
          if (!range) break;
          store.applyFormatToRange(range, action.format as Partial<CellFormat>);
          applied.push(`Formatted ${action.range}`);
          break;
        }
        case 'create_sheet': {
          store.addSheet();
          if (action.name) {
            const sheets = useSpreadsheetStore.getState().sheets;
            const latest = sheets[sheets.length - 1];
            store.renameSheet(latest.id, action.name);
          }
          applied.push(`Created sheet${action.name ? ` "${action.name}"` : ''}`);
          break;
        }
        case 'select_range': {
          if (!action.range) break;
          const range = parseRange(action.range);
          if (!range) break;
          store.setSelection(range);
          applied.push(`Selected ${action.range}`);
          break;
        }
        case 'clear_range': {
          if (!action.range) break;
          const range = parseRange(action.range);
          if (!range) break;
          store.setSelection(range);
          store.clearSelection();
          applied.push(`Cleared ${action.range}`);
          break;
        }
      }
    } catch (err) {
      applied.push(`Failed: ${action.type} — ${err}`);
    }
  }

  if (applied.length) {
    useSpreadsheetStore.getState().saveToStorage();
  }

  return applied;
}

function parseRange(range: string) {
  const parts = range.split(':');
  if (parts.length === 1) {
    const pos = fromAddress(parts[0]);
    if (!pos) return null;
    return { startRow: pos.row, startCol: pos.col, endRow: pos.row, endCol: pos.col };
  }
  const start = fromAddress(parts[0]);
  const end = fromAddress(parts[1]);
  if (!start || !end) return null;
  return normalizeSelection({
    startRow: start.row,
    startCol: start.col,
    endRow: end.row,
    endCol: end.col,
  });
}

export function getComputedSummary(): string {
  const store = useSpreadsheetStore.getState();
  const sheet = store.getActiveSheet();
  const sel = normalizeSelection(store.selection);
  const getRaw = (r: number, c: number) => sheet.cells[`${r},${c}`]?.raw ?? '';

  const nums: number[] = [];
  for (let r = sel.startRow; r <= sel.endRow; r++) {
    for (let c = sel.startCol; c <= sel.endCol; c++) {
      const val = computeCellValue(getRaw(r, c), r, c, getRaw);
      if (typeof val === 'number') nums.push(val);
    }
  }

  if (!nums.length) return '';
  const sum = nums.reduce((a, b) => a + b, 0);
  return `Sum: ${sum.toLocaleString()}, Avg: ${(sum / nums.length).toLocaleString()}`;
}
