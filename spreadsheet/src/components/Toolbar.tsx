import { useSpreadsheetStore } from '../store/spreadsheetStore';
import { exportToCsv, importFromCsv, downloadFile } from '../utils/csv';
import './Toolbar.css';

export function Toolbar() {
  const undo = useSpreadsheetStore((s) => s.undo);
  const redo = useSpreadsheetStore((s) => s.redo);
  const copy = useSpreadsheetStore((s) => s.copy);
  const cut = useSpreadsheetStore((s) => s.cut);
  const paste = useSpreadsheetStore((s) => s.paste);
  const setCellFormat = useSpreadsheetStore((s) => s.setCellFormat);
  const getActiveSheet = useSpreadsheetStore((s) => s.getActiveSheet);
  const loadWorkbook = useSpreadsheetStore((s) => s.loadWorkbook);
  const activeSheetId = useSpreadsheetStore((s) => s.activeSheetId);
  const sheets = useSpreadsheetStore((s) => s.sheets);

  const handleExport = () => {
    const csv = exportToCsv(getActiveSheet());
    downloadFile(csv, `${getActiveSheet().name}.csv`, 'text/csv');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const cells = importFromCsv(reader.result as string);
        const sheet = getActiveSheet();
        const updated = sheets.map((s) =>
          s.id === sheet.id ? { ...s, cells } : s,
        );
        loadWorkbook(updated, activeSheetId);
        useSpreadsheetStore.getState().saveToStorage();
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <span className="brand-icon">📊</span>
        <span className="brand-name">SheetCraft</span>
      </div>

      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={undo} title="Undo (Ctrl+Z)">
          ↩
        </button>
        <button className="toolbar-btn" onClick={redo} title="Redo (Ctrl+Y)">
          ↪
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button className="toolbar-btn" onClick={copy} title="Copy (Ctrl+C)">
          📋
        </button>
        <button className="toolbar-btn" onClick={cut} title="Cut (Ctrl+X)">
          ✂️
        </button>
        <button className="toolbar-btn" onClick={paste} title="Paste (Ctrl+V)">
          📌
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button className="toolbar-btn format-btn" onClick={() => setCellFormat({ bold: true })} title="Bold">
          <strong>B</strong>
        </button>
        <button className="toolbar-btn format-btn" onClick={() => setCellFormat({ italic: true })} title="Italic">
          <em>I</em>
        </button>
        <button className="toolbar-btn format-btn" onClick={() => setCellFormat({ underline: true })} title="Underline">
          <u>U</u>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <button className="toolbar-btn format-btn" onClick={() => setCellFormat({ align: 'left' })} title="Align Left">
          ≡
        </button>
        <button className="toolbar-btn format-btn" onClick={() => setCellFormat({ align: 'center' })} title="Center">
          ≡
        </button>
        <button className="toolbar-btn format-btn" onClick={() => setCellFormat({ align: 'right' })} title="Align Right">
          ≡
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <select
          className="format-select"
          onChange={(e) => setCellFormat({ numberFormat: e.target.value as 'general' | 'number' | 'currency' | 'percent' })}
          defaultValue="general"
        >
          <option value="general">General</option>
          <option value="number">Number</option>
          <option value="currency">Currency</option>
          <option value="percent">Percent</option>
        </select>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <input
          type="color"
          className="color-picker"
          title="Text Color"
          onChange={(e) => setCellFormat({ color: e.target.value })}
        />
        <input
          type="color"
          className="color-picker"
          title="Fill Color"
          defaultValue="#ffffff"
          onChange={(e) => setCellFormat({ bgColor: e.target.value })}
        />
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-section">
        <button className="toolbar-btn action-btn" onClick={() => {
          localStorage.removeItem('excel-clone-workbook');
          loadWorkbook(
            [{ id: crypto.randomUUID(), name: 'Sheet1', cells: {}, colWidths: {}, rowHeights: {} }],
            '',
          );
          const id = useSpreadsheetStore.getState().sheets[0].id;
          useSpreadsheetStore.setState({ activeSheetId: id });
          useSpreadsheetStore.getState().saveToStorage();
        }}>
          New
        </button>
        <button className="toolbar-btn action-btn" onClick={handleImport}>
          Import CSV
        </button>
        <button className="toolbar-btn action-btn" onClick={handleExport}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
