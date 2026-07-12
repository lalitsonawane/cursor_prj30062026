import { useSpreadsheetStore } from '../store/spreadsheetStore';
import './SheetTabs.css';

export function SheetTabs() {
  const sheets = useSpreadsheetStore((s) => s.sheets);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const setActiveSheet = useSpreadsheetStore((s) => s.setActiveSheet);
  const addSheet = useSpreadsheetStore((s) => s.addSheet);
  const removeSheet = useSpreadsheetStore((s) => s.removeSheet);
  const renameSheet = useSpreadsheetStore((s) => s.renameSheet);

  const handleRename = (id: string, currentName: string) => {
    const name = prompt('Sheet name:', currentName);
    if (name?.trim()) renameSheet(id, name.trim());
  };

  return (
    <div className="sheet-tabs">
      <div className="tabs-scroll">
        {sheets.map((sheet) => (
          <button
            key={sheet.id}
            className={`sheet-tab ${sheet.id === activeSheetId ? 'active' : ''}`}
            onClick={() => setActiveSheet(sheet.id)}
            onDoubleClick={() => handleRename(sheet.id, sheet.name)}
          >
            {sheet.name}
            {sheets.length > 1 && (
              <span
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSheet(sheet.id);
                }}
              >
                ×
              </span>
            )}
          </button>
        ))}
      </div>
      <button className="add-sheet-btn" onClick={addSheet} title="Add sheet">
        +
      </button>
    </div>
  );
}
