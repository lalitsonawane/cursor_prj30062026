import { useEffect } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import { COL_COUNT, ROW_COUNT } from '../types';

export function useKeyboard() {
  const selection = useSpreadsheetStore((s) => s.selection);
  const setSelection = useSpreadsheetStore((s) => s.setSelection);
  const startEdit = useSpreadsheetStore((s) => s.startEdit);
  const commitEdit = useSpreadsheetStore((s) => s.commitEdit);
  const cancelEdit = useSpreadsheetStore((s) => s.cancelEdit);
  const editingCell = useSpreadsheetStore((s) => s.editingCell);
  const setEditValue = useSpreadsheetStore((s) => s.setEditValue);
  const copy = useSpreadsheetStore((s) => s.copy);
  const cut = useSpreadsheetStore((s) => s.cut);
  const paste = useSpreadsheetStore((s) => s.paste);
  const undo = useSpreadsheetStore((s) => s.undo);
  const redo = useSpreadsheetStore((s) => s.redo);
  const clearSelection = useSpreadsheetStore((s) => s.clearSelection);
  const fillDown = useSpreadsheetStore((s) => s.fillDown);
  const getCellRaw = useSpreadsheetStore((s) => s.getCellRaw);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isFormulaBar = target.classList.contains('formula-input');
      const isCellEditor = target.classList.contains('cell-editor');

      if (editingCell && !isFormulaBar && !isCellEditor) return;

      const { startRow, startCol } = selection;
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if (ctrl && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && e.key === 'c') {
        e.preventDefault();
        copy();
        return;
      }
      if (ctrl && e.key === 'x') {
        e.preventDefault();
        cut();
        return;
      }
      if (ctrl && e.key === 'v') {
        e.preventDefault();
        paste();
        return;
      }
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        fillDown();
        return;
      }

      if (editingCell) {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        clearSelection();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        startEdit(startRow, startCol);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        const nextRow = Math.min(startRow + 1, ROW_COUNT - 1);
        setSelection({ startRow: nextRow, startCol, endRow: nextRow, endCol: startCol });
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const nextCol = e.shiftKey
          ? Math.max(startCol - 1, 0)
          : Math.min(startCol + 1, COL_COUNT - 1);
        setSelection({ startRow, startCol: nextCol, endRow: startRow, endCol: nextCol });
        return;
      }

      const move = (dr: number, dc: number) => {
        const nr = Math.max(0, Math.min(ROW_COUNT - 1, startRow + dr));
        const nc = Math.max(0, Math.min(COL_COUNT - 1, startCol + dc));
        if (e.shiftKey) {
          setSelection({ startRow: selection.startRow, startCol: selection.startCol, endRow: nr, endCol: nc });
        } else {
          setSelection({ startRow: nr, startCol: nc, endRow: nr, endCol: nc });
        }
      };

      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); move(-1, 0); break;
        case 'ArrowDown': e.preventDefault(); move(1, 0); break;
        case 'ArrowLeft': e.preventDefault(); move(0, -1); break;
        case 'ArrowRight': e.preventDefault(); move(0, 1); break;
        case 'Home':
          e.preventDefault();
          if (ctrl) move(-startRow, -startCol);
          else move(0, -startCol);
          break;
        case 'End':
          e.preventDefault();
          if (ctrl) setSelection({ startRow: ROW_COUNT - 1, startCol: COL_COUNT - 1, endRow: ROW_COUNT - 1, endCol: COL_COUNT - 1 });
          else setSelection({ startRow, startCol: COL_COUNT - 1, endRow: startRow, endCol: COL_COUNT - 1 });
          break;
        default:
          if (e.key.length === 1 && !ctrl) {
            startEdit(startRow, startCol);
            setEditValue(e.key === '=' ? '=' : e.key);
          }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    selection, editingCell, setSelection, startEdit, commitEdit, cancelEdit,
    setEditValue, copy, cut, paste, undo, redo, clearSelection, fillDown, getCellRaw,
  ]);
}
