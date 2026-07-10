import { useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { FormulaBar } from './components/FormulaBar';
import { Grid } from './components/Grid';
import { SheetTabs } from './components/SheetTabs';
import { StatusBar } from './components/StatusBar';
import { useKeyboard } from './hooks/useKeyboard';
import { useSpreadsheetStore } from './store/spreadsheetStore';
import { DEMO_SHEETS } from './data/demoWorkbook';
import './App.css';

const STORAGE_KEY = 'excel-clone-workbook';

function App() {
  const loadFromStorage = useSpreadsheetStore((s) => s.loadFromStorage);
  const loadWorkbook = useSpreadsheetStore((s) => s.loadWorkbook);
  useKeyboard();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      loadFromStorage();
    } else {
      loadWorkbook(DEMO_SHEETS, DEMO_SHEETS[0].id);
      useSpreadsheetStore.getState().saveToStorage();
    }
  }, [loadFromStorage, loadWorkbook]);

  return (
    <div className="app">
      <Toolbar />
      <FormulaBar />
      <Grid />
      <SheetTabs />
      <StatusBar />
    </div>
  );
}

export default App;
