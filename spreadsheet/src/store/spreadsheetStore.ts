import { create } from 'zustand';
import type { CellData, CellFormat, Selection, Sheet } from '../types';
import { DEFAULT_FORMAT, DEFAULT_COL_WIDTH, DEFAULT_ROW_HEIGHT } from '../types';
import { cellKey, normalizeSelection } from '../utils/cellAddress';

const STORAGE_KEY = 'excel-clone-workbook';

function createSheet(name: string, id?: string): Sheet {
  return {
    id: id ?? crypto.randomUUID(),
    name,
    cells: {},
    colWidths: {},
    rowHeights: {},
  };
}

function cloneSheets(sheets: Sheet[]): Sheet[] {
  return JSON.parse(JSON.stringify(sheets));
}

interface Store {
  sheets: Sheet[];
  activeSheetId: string;
  selection: Selection;
  editingCell: { row: number; col: number } | null;
  editValue: string;
  clipboard: { cells: Record<string, CellData>; rows: number; cols: number } | null;
  undoStack: Sheet[][];
  redoStack: Sheet[][];
  aiPanelOpen: boolean;

  getActiveSheet: () => Sheet;
  getCell: (row: number, col: number) => CellData | undefined;
  getCellRaw: (row: number, col: number) => string;
  setCell: (row: number, col: number, raw: string, pushHistory?: boolean) => void;
  setCellsBatch: (updates: { row: number; col: number; raw: string }[]) => void;
  applyFormatToRange: (sel: Selection, format: Partial<CellFormat>) => void;
  setCellFormat: (format: Partial<CellFormat>) => void;
  setSelection: (sel: Selection) => void;
  startEdit: (row: number, col: number) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  setEditValue: (v: string) => void;
  addSheet: () => void;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  setColWidth: (col: number, width: number) => void;
  setRowHeight: (row: number, height: number) => void;
  copy: () => void;
  cut: () => void;
  paste: () => void;
  undo: () => void;
  redo: () => void;
  fillDown: () => void;
  fillRight: () => void;
  clearSelection: () => void;
  loadWorkbook: (sheets: Sheet[], activeId: string) => void;
  saveToStorage: () => void;
  loadFromStorage: () => void;
  setAiPanelOpen: (open: boolean) => void;
}

function pushUndo(state: Store) {
  return {
    undoStack: [...state.undoStack.slice(-49), cloneSheets(state.sheets)],
    redoStack: [],
  };
}

export const useSpreadsheetStore = create<Store>((set, get) => {
  const initial = createSheet('Sheet1');
  return {
    sheets: [initial],
    activeSheetId: initial.id,
    selection: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
    editingCell: null,
    editValue: '',
    clipboard: null,
    undoStack: [],
    redoStack: [],
    aiPanelOpen: true,

    getActiveSheet: () => get().sheets.find((s) => s.id === get().activeSheetId)!,

    getCell: (row, col) => {
      const sheet = get().getActiveSheet();
      return sheet.cells[cellKey(row, col)];
    },

    getCellRaw: (row, col) => get().getCell(row, col)?.raw ?? '',

    setCell: (row, col, raw, pushHistory = true) => {
      set((state) => {
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        const key = cellKey(row, col);
        if (!raw) {
          delete sheet.cells[key];
        } else {
          sheet.cells[key] = {
            raw,
            format: sheet.cells[key]?.format ?? { ...DEFAULT_FORMAT },
          };
        }
        return {
          sheets,
          ...(pushHistory ? pushUndo(state) : {}),
        };
      });
      get().saveToStorage();
    },

    setCellsBatch: (updates) => {
      if (!updates.length) return;
      set((state) => {
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        for (const { row, col, raw } of updates) {
          const key = cellKey(row, col);
          if (!raw) delete sheet.cells[key];
          else {
            sheet.cells[key] = {
              raw,
              format: sheet.cells[key]?.format ?? { ...DEFAULT_FORMAT },
            };
          }
        }
        return { sheets, ...pushUndo(state) };
      });
      get().saveToStorage();
    },

    applyFormatToRange: (sel, format) => {
      const normalized = normalizeSelection(sel);
      set((state) => {
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        for (let r = normalized.startRow; r <= normalized.endRow; r++) {
          for (let c = normalized.startCol; c <= normalized.endCol; c++) {
            const key = cellKey(r, c);
            const existing = sheet.cells[key];
            sheet.cells[key] = {
              raw: existing?.raw ?? '',
              format: { ...(existing?.format ?? DEFAULT_FORMAT), ...format },
            };
          }
        }
        return { sheets, ...pushUndo(state) };
      });
      get().saveToStorage();
    },

    setCellFormat: (format) => {
      set((state) => {
        const sel = normalizeSelection(state.selection);
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        for (let r = sel.startRow; r <= sel.endRow; r++) {
          for (let c = sel.startCol; c <= sel.endCol; c++) {
            const key = cellKey(r, c);
            const existing = sheet.cells[key];
            const prevFormat = existing?.format ?? DEFAULT_FORMAT;
            const nextFormat = { ...prevFormat };
            for (const [k, v] of Object.entries(format)) {
              if (k === 'bold' || k === 'italic' || k === 'underline') {
                (nextFormat as Record<string, unknown>)[k] = !(prevFormat as Record<string, unknown>)[k];
              } else {
                (nextFormat as Record<string, unknown>)[k] = v;
              }
            }
            sheet.cells[key] = {
              raw: existing?.raw ?? '',
              format: nextFormat,
            };
          }
        }
        return { sheets, ...pushUndo(state) };
      });
      get().saveToStorage();
    },

    setSelection: (sel) => set({ selection: sel }),

    startEdit: (row, col) => {
      const raw = get().getCellRaw(row, col);
      set({ editingCell: { row, col }, editValue: raw });
    },

    commitEdit: () => {
      const { editingCell, editValue } = get();
      if (editingCell) {
        get().setCell(editingCell.row, editingCell.col, editValue);
        set({ editingCell: null, editValue: '' });
      }
    },

    cancelEdit: () => set({ editingCell: null, editValue: '' }),

    setEditValue: (v) => set({ editValue: v }),

    addSheet: () => {
      set((state) => {
        const n = state.sheets.length + 1;
        const sheet = createSheet(`Sheet${n}`);
        return {
          sheets: [...state.sheets, sheet],
          activeSheetId: sheet.id,
          ...pushUndo(state),
        };
      });
      get().saveToStorage();
    },

    removeSheet: (id) => {
      set((state) => {
        if (state.sheets.length <= 1) return state;
        const sheets = state.sheets.filter((s) => s.id !== id);
        const activeSheetId = state.activeSheetId === id ? sheets[0].id : state.activeSheetId;
        return { sheets, activeSheetId, ...pushUndo(state) };
      });
      get().saveToStorage();
    },

    renameSheet: (id, name) => {
      set((state) => {
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === id);
        if (sheet) sheet.name = name;
        return { sheets, ...pushUndo(state) };
      });
      get().saveToStorage();
    },

    setActiveSheet: (id) => set({ activeSheetId: id, selection: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 } }),

    setColWidth: (col, width) => {
      set((state) => {
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        sheet.colWidths[col] = Math.max(40, width);
        return { sheets };
      });
    },

    setRowHeight: (row, height) => {
      set((state) => {
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        sheet.rowHeights[row] = Math.max(18, height);
        return { sheets };
      });
    },

    copy: () => {
      const state = get();
      const sel = normalizeSelection(state.selection);
      const sheet = state.getActiveSheet();
      const cells: Record<string, CellData> = {};
      const rows = sel.endRow - sel.startRow + 1;
      const cols = sel.endCol - sel.startCol + 1;
      for (let r = sel.startRow; r <= sel.endRow; r++) {
        for (let c = sel.startCol; c <= sel.endCol; c++) {
          const key = cellKey(r - sel.startRow, c - sel.startCol);
          const src = sheet.cells[cellKey(r, c)];
          if (src) cells[key] = JSON.parse(JSON.stringify(src));
        }
      }
      set({ clipboard: { cells, rows, cols } });
      navigator.clipboard?.writeText(
        Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => cells[cellKey(r, c)]?.raw ?? '').join('\t'),
        ).join('\n'),
      ).catch(() => {});
    },

    cut: () => {
      get().copy();
      get().clearSelection();
    },

    paste: () => {
      const { clipboard, selection } = get();
      if (!clipboard) return;
      const sel = normalizeSelection(selection);
      set((state) => {
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        for (const [key, cell] of Object.entries(clipboard.cells)) {
          const [dr, dc] = key.split(',').map(Number);
          const tr = sel.startRow + dr;
          const tc = sel.startCol + dc;
          sheet.cells[cellKey(tr, tc)] = JSON.parse(JSON.stringify(cell));
        }
        return { sheets, ...pushUndo(state) };
      });
      get().saveToStorage();
    },

    undo: () => {
      set((state) => {
        if (!state.undoStack.length) return state;
        const prev = state.undoStack[state.undoStack.length - 1];
        return {
          sheets: prev,
          undoStack: state.undoStack.slice(0, -1),
          redoStack: [...state.redoStack, cloneSheets(state.sheets)],
        };
      });
      get().saveToStorage();
    },

    redo: () => {
      set((state) => {
        if (!state.redoStack.length) return state;
        const next = state.redoStack[state.redoStack.length - 1];
        return {
          sheets: next,
          redoStack: state.redoStack.slice(0, -1),
          undoStack: [...state.undoStack, cloneSheets(state.sheets)],
        };
      });
      get().saveToStorage();
    },

    fillDown: () => {
      const state = get();
      const sel = normalizeSelection(state.selection);
      if (sel.endRow <= sel.startRow) return;
      const sourceRow = sel.startRow;
      set((s) => {
        const sheets = cloneSheets(s.sheets);
        const sheet = sheets.find((sh) => sh.id === s.activeSheetId)!;
        for (let r = sourceRow + 1; r <= sel.endRow; r++) {
          for (let c = sel.startCol; c <= sel.endCol; c++) {
            const src = sheet.cells[cellKey(sourceRow, c)];
            if (src) sheet.cells[cellKey(r, c)] = JSON.parse(JSON.stringify(src));
          }
        }
        return { sheets, ...pushUndo(s) };
      });
      get().saveToStorage();
    },

    fillRight: () => {
      const state = get();
      const sel = normalizeSelection(state.selection);
      if (sel.endCol <= sel.startCol) return;
      const sourceCol = sel.startCol;
      set((s) => {
        const sheets = cloneSheets(s.sheets);
        const sheet = sheets.find((sh) => sh.id === s.activeSheetId)!;
        for (let c = sourceCol + 1; c <= sel.endCol; c++) {
          for (let r = sel.startRow; r <= sel.endRow; r++) {
            const src = sheet.cells[cellKey(r, sourceCol)];
            if (src) sheet.cells[cellKey(r, c)] = JSON.parse(JSON.stringify(src));
          }
        }
        return { sheets, ...pushUndo(s) };
      });
      get().saveToStorage();
    },

    clearSelection: () => {
      set((state) => {
        const sel = normalizeSelection(state.selection);
        const sheets = cloneSheets(state.sheets);
        const sheet = sheets.find((s) => s.id === state.activeSheetId)!;
        for (let r = sel.startRow; r <= sel.endRow; r++) {
          for (let c = sel.startCol; c <= sel.endCol; c++) {
            delete sheet.cells[cellKey(r, c)];
          }
        }
        return { sheets, ...pushUndo(state) };
      });
      get().saveToStorage();
    },

    loadWorkbook: (sheets, activeId) => set({ sheets, activeSheetId: activeId }),

    saveToStorage: () => {
      const { sheets, activeSheetId } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sheets, activeSheetId }));
    },

    loadFromStorage: () => {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          const { sheets, activeSheetId } = JSON.parse(data);
          set({ sheets, activeSheetId });
        }
      } catch { /* ignore */ }
    },

    setAiPanelOpen: (open) => set({ aiPanelOpen: open }),
  };
});

export function getColWidth(sheet: Sheet, col: number): number {
  return sheet.colWidths[col] ?? DEFAULT_COL_WIDTH;
}

export function getRowHeight(sheet: Sheet, row: number): number {
  return sheet.rowHeights[row] ?? DEFAULT_ROW_HEIGHT;
}
