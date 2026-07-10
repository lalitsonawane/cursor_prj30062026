import { useRef, useCallback, useState, useEffect } from 'react';
import { useSpreadsheetStore, getColWidth, getRowHeight } from '../store/spreadsheetStore';
import { COL_COUNT, ROW_COUNT, ROW_HEADER_WIDTH } from '../types';
import { colToLetter } from '../utils/cellAddress';
import { Cell } from './Cell';
import './Grid.css';

export function Grid() {
  const sheet = useSpreadsheetStore((s) => s.sheets.find((sh) => sh.id === s.activeSheetId)!);
  const selection = useSpreadsheetStore((s) => s.selection);
  const setSelection = useSpreadsheetStore((s) => s.setSelection);
  const setColWidth = useSpreadsheetStore((s) => s.setColWidth);
  const setRowHeight = useSpreadsheetStore((s) => s.setRowHeight);

  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{ type: 'col' | 'row'; index: number; startPos: number; startSize: number } | null>(null);

  const handleColResizeStart = (col: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ type: 'col', index: col, startPos: e.clientX, startSize: getColWidth(sheet, col) });
  };

  const handleRowResizeStart = (row: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ type: 'row', index: row, startPos: e.clientY, startSize: getRowHeight(sheet, row) });
  };

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizing) return;
    if (resizing.type === 'col') {
      const delta = e.clientX - resizing.startPos;
      setColWidth(resizing.index, resizing.startSize + delta);
    } else {
      const delta = e.clientY - resizing.startPos;
      setRowHeight(resizing.index, resizing.startSize + delta);
    }
  }, [resizing, setColWidth, setRowHeight]);

  const handleResizeEnd = useCallback(() => setResizing(null), []);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizing, handleResizeMove, handleResizeEnd]);

  const handleCornerClick = () => {
    setSelection({ startRow: 0, startCol: 0, endRow: ROW_COUNT - 1, endCol: COL_COUNT - 1 });
  };

  const handleColHeaderClick = (col: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      setSelection({ ...selection, endCol: col });
    } else {
      setSelection({ startRow: 0, startCol: col, endRow: ROW_COUNT - 1, endCol: col });
    }
  };

  const handleRowHeaderClick = (row: number, e: React.MouseEvent) => {
    if (e.shiftKey) {
      setSelection({ ...selection, endRow: row });
    } else {
      setSelection({ startRow: row, startCol: 0, endRow: row, endCol: COL_COUNT - 1 });
    }
  };

  return (
    <div className="grid-container" ref={containerRef}>
      <div className="grid-scroll">
        <div className="grid-table">
          <div className="header-row">
            <div
              className="grid-corner"
              style={{ width: ROW_HEADER_WIDTH, minWidth: ROW_HEADER_WIDTH }}
              onClick={handleCornerClick}
            />
            {Array.from({ length: COL_COUNT }, (_, col) => (
              <div
                key={col}
                className="col-header"
                style={{ width: getColWidth(sheet, col), minWidth: getColWidth(sheet, col) }}
                onClick={(e) => handleColHeaderClick(col, e)}
              >
                {colToLetter(col)}
                <div className="resize-handle-col" onMouseDown={(e) => handleColResizeStart(col, e)} />
              </div>
            ))}
          </div>

          {Array.from({ length: ROW_COUNT }, (_, row) => (
            <div key={row} className="data-row">
              <div
                className="row-header"
                style={{
                  width: ROW_HEADER_WIDTH,
                  minWidth: ROW_HEADER_WIDTH,
                  height: getRowHeight(sheet, row),
                  minHeight: getRowHeight(sheet, row),
                }}
                onClick={(e) => handleRowHeaderClick(row, e)}
              >
                {row + 1}
                <div className="resize-handle-row" onMouseDown={(e) => handleRowResizeStart(row, e)} />
              </div>
              {Array.from({ length: COL_COUNT }, (_, col) => (
                <Cell
                  key={col}
                  row={row}
                  col={col}
                  width={getColWidth(sheet, col)}
                  height={getRowHeight(sheet, row)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
