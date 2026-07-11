import { useMemo } from 'react';
import type { CellFormat } from '../types';
import { computeCellValue, formatDisplayValue } from '../formula/evaluator';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import { isInSelection } from '../utils/cellAddress';
import './Cell.css';

interface CellProps {
  row: number;
  col: number;
  width: number;
  height: number;
}

export function Cell({ row, col, width, height }: CellProps) {
  const selection = useSpreadsheetStore((s) => s.selection);
  const editingCell = useSpreadsheetStore((s) => s.editingCell);
  const editValue = useSpreadsheetStore((s) => s.editValue);
  const getCell = useSpreadsheetStore((s) => s.getCell);
  const getCellRaw = useSpreadsheetStore((s) => s.getCellRaw);
  const setSelection = useSpreadsheetStore((s) => s.setSelection);
  const startEdit = useSpreadsheetStore((s) => s.startEdit);
  const setEditValue = useSpreadsheetStore((s) => s.setEditValue);
  const commitEdit = useSpreadsheetStore((s) => s.commitEdit);

  const cell = getCell(row, col);
  const raw = cell?.raw ?? '';
  const format: CellFormat = cell?.format ?? { align: 'left' };

  const computed = useMemo(() => {
    return computeCellValue(raw, row, col, getCellRaw);
  }, [raw, row, col, getCellRaw]);

  const display = useMemo(() => {
    return formatDisplayValue(computed, format.numberFormat, format.decimalPlaces ?? 2);
  }, [computed, format.numberFormat, format.decimalPlaces]);

  const isSelected = isInSelection(row, col, selection);
  const isActive = selection.startRow === row && selection.startCol === col && !selection.endRow && !selection.endCol
    || (selection.startRow === row && selection.startCol === col);
  const isEditing = editingCell?.row === row && editingCell?.col === col;

  const isTopLeft = selection.startRow === row && selection.startCol === col;
  const sel = selection;
  const isRange = sel.startRow !== sel.endRow || sel.startCol !== sel.endCol;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      setSelection({
        startRow: selection.startRow,
        startCol: selection.startCol,
        endRow: row,
        endCol: col,
      });
    } else {
      setSelection({ startRow: row, startCol: col, endRow: row, endCol: col });
    }
  };

  const handleDoubleClick = () => {
    startEdit(row, col);
  };

  const style: React.CSSProperties = {
    width,
    height,
    fontWeight: format.bold ? 'bold' : 'normal',
    fontStyle: format.italic ? 'italic' : 'normal',
    textDecoration: format.underline ? 'underline' : 'none',
    textAlign: format.align ?? 'left',
    color: format.color ?? '#000',
    backgroundColor: format.bgColor ?? (isSelected ? '#e2efda' : '#fff'),
    fontSize: format.fontSize ?? 13,
  };

  return (
    <div
      className={`cell ${isSelected ? 'selected' : ''} ${isActive && isTopLeft ? 'active' : ''} ${isRange && isTopLeft ? 'range-anchor' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          className="cell-editor"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === 'Escape') {
              useSpreadsheetStore.getState().cancelEdit();
            }
          }}
          autoFocus
          style={{ textAlign: format.align ?? 'left' }}
        />
      ) : (
        <span className="cell-content">{display}</span>
      )}
    </div>
  );
}
