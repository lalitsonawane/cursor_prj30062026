export type Align = 'left' | 'center' | 'right';
export type NumberFormat = 'general' | 'number' | 'currency' | 'percent' | 'date';

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: Align;
  color?: string;
  bgColor?: string;
  numberFormat?: NumberFormat;
  fontSize?: number;
  decimalPlaces?: number;
}

export interface CellData {
  raw: string;
  format: CellFormat;
}

export interface Sheet {
  id: string;
  name: string;
  cells: Record<string, CellData>;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
}

export interface Selection {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface SpreadsheetState {
  sheets: Sheet[];
  activeSheetId: string;
  selection: Selection;
  editingCell: { row: number; col: number } | null;
  editValue: string;
  clipboard: { cells: Record<string, CellData>; rows: number; cols: number } | null;
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
}

export interface HistoryEntry {
  sheets: Sheet[];
  activeSheetId: string;
}

export const DEFAULT_COL_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 24;
export const ROW_HEADER_WIDTH = 46;
export const COL_COUNT = 26;
export const ROW_COUNT = 200;
export const DEFAULT_FORMAT: CellFormat = { align: 'left', numberFormat: 'general', fontSize: 13 };
