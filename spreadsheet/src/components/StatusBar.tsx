import { useMemo } from 'react';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import { computeCellValue, formatDisplayValue } from '../formula/evaluator';
import { normalizeSelection } from '../utils/cellAddress';
import './StatusBar.css';

export function StatusBar() {
  const selection = useSpreadsheetStore((s) => s.selection);
  const getActiveSheet = useSpreadsheetStore((s) => s.getActiveSheet);
  const getCellRaw = useSpreadsheetStore((s) => s.getCellRaw);

  const stats = useMemo(() => {
    const sel = normalizeSelection(selection);
    const sheet = getActiveSheet();
    const getRaw = (r: number, c: number) => sheet.cells[`${r},${c}`]?.raw ?? '';

    let sum = 0;
    let count = 0;
    let numericCount = 0;

    for (let r = sel.startRow; r <= sel.endRow; r++) {
      for (let c = sel.startCol; c <= sel.endCol; c++) {
        const raw = getCellRaw(r, c);
        if (raw) {
          count++;
          const val = computeCellValue(raw, r, c, getRaw);
          if (typeof val === 'number') {
            sum += val;
            numericCount++;
          }
        }
      }
    }

    const avg = numericCount ? sum / numericCount : 0;
    return { sum, count, avg, numericCount };
  }, [selection, getActiveSheet, getCellRaw]);

  return (
    <div className="status-bar">
      <span className="status-item">Ready</span>
      <div className="status-spacer" />
      {stats.numericCount > 0 && (
        <>
          <span className="status-item">Sum: {formatDisplayValue(stats.sum, 'number', 2)}</span>
          <span className="status-item">Average: {formatDisplayValue(stats.avg, 'number', 2)}</span>
          <span className="status-item">Count: {stats.count}</span>
        </>
      )}
    </div>
  );
}
