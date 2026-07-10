import type { CellFormat, Selection, Sheet } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  actions?: AiAction[];
  mode?: 'local' | 'openai';
}

export interface SelectionContext {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  startAddress: string;
  endAddress: string;
}

export interface WorkbookContextPayload {
  activeSheet: string;
  sheets: string[];
  selection: {
    start_row: number;
    start_col: number;
    end_row: number;
    end_col: number;
    start_address: string;
    end_address: string;
  };
  used_range_csv: string;
  selection_csv: string;
}

export type AiActionType =
  | 'set_cell'
  | 'set_cells'
  | 'format_range'
  | 'create_sheet'
  | 'select_range'
  | 'clear_range';

export interface AiAction {
  type: AiActionType;
  address?: string;
  range?: string;
  value?: string;
  values?: { address: string; value: string }[];
  format?: Partial<CellFormat>;
  name?: string;
}

export interface AiChatResponse {
  reply: string;
  actions: AiAction[];
  mode: 'local' | 'openai';
}

export interface QuickPrompt {
  label: string;
  prompt: string;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
  { label: 'Summarize selection', prompt: 'Summarize and analyze the selected data' },
  { label: 'Sum formula', prompt: 'Add a SUM formula for the selected range in the cell below' },
  { label: 'Bold headers', prompt: 'Format the header row (A1:F1) bold' },
  { label: 'Total profit?', prompt: 'What is the total profit?' },
  { label: 'Currency format', prompt: 'Format the selection as currency' },
  { label: 'Help', prompt: 'What can you do?' },
];

export function buildSelectionContext(selection: Selection): SelectionContext {
  const startRow = Math.min(selection.startRow, selection.endRow);
  const endRow = Math.max(selection.startRow, selection.endRow);
  const startCol = Math.min(selection.startCol, selection.endCol);
  const endCol = Math.max(selection.startCol, selection.endCol);
  return {
    startRow,
    startCol,
    endRow,
    endCol,
    startAddress: `${colLetter(startCol)}${startRow + 1}`,
    endAddress: `${colLetter(endCol)}${endRow + 1}`,
  };
}

function colLetter(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode(65 + (c % 26)) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

export function sheetsToCsv(sheet: Sheet, maxRow = 50, maxCol = 15): string {
  let lastRow = 0;
  let lastCol = 0;
  for (const key of Object.keys(sheet.cells)) {
    const [r, c] = key.split(',').map(Number);
    if (r > lastRow) lastRow = r;
    if (c > lastCol) lastCol = c;
  }
  lastRow = Math.min(lastRow, maxRow);
  lastCol = Math.min(lastCol, maxCol);

  const rows: string[] = [];
  for (let r = 0; r <= lastRow; r++) {
    const cells: string[] = [];
    for (let c = 0; c <= lastCol; c++) {
      const raw = sheet.cells[`${r},${c}`]?.raw ?? '';
      cells.push(raw.includes(',') ? `"${raw}"` : raw);
    }
    rows.push(cells.join(','));
  }
  return rows.join('\n');
}

export function selectionToCsv(sheet: Sheet, selection: Selection): string {
  const startRow = Math.min(selection.startRow, selection.endRow);
  const endRow = Math.max(selection.startRow, selection.endRow);
  const startCol = Math.min(selection.startCol, selection.endCol);
  const endCol = Math.max(selection.startCol, selection.endCol);

  const rows: string[] = [];
  for (let r = startRow; r <= endRow; r++) {
    const cells: string[] = [];
    for (let c = startCol; c <= endCol; c++) {
      const raw = sheet.cells[`${r},${c}`]?.raw ?? '';
      cells.push(raw.includes(',') ? `"${raw}"` : raw);
    }
    rows.push(cells.join(','));
  }
  return rows.join('\n');
}
