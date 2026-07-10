import type { KeyboardEvent } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import { toAddress } from '../utils/cellAddress';
import './FormulaBar.css';

export function FormulaBar() {
  const selection = useSpreadsheetStore((s) => s.selection);
  const editingCell = useSpreadsheetStore((s) => s.editingCell);
  const editValue = useSpreadsheetStore((s) => s.editValue);
  const setEditValue = useSpreadsheetStore((s) => s.setEditValue);
  const commitEdit = useSpreadsheetStore((s) => s.commitEdit);
  const getCellRaw = useSpreadsheetStore((s) => s.getCellRaw);
  const startEdit = useSpreadsheetStore((s) => s.startEdit);

  const { startRow, startCol } = selection;
  const address = toAddress(startRow, startCol);
  const displayValue = editingCell
    ? editValue
    : getCellRaw(startRow, startCol);

  const handleChange = (v: string) => {
    if (!editingCell) startEdit(startRow, startCol);
    setEditValue(v);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    }
  };

  return (
    <div className="formula-bar">
      <div className="name-box">{address}</div>
      <div className="fx-label">fx</div>
      <input
        className="formula-input"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitEdit}
        spellCheck={false}
      />
    </div>
  );
}
