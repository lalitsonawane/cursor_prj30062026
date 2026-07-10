# SheetCraft — Excel Clone

A full-featured browser-based spreadsheet application built with React, TypeScript, and Vite.

## Features

- **Grid**: 200 rows × 26 columns with sticky row/column headers
- **AI Copilot**: Cursor-style sidebar — analyze data, write formulas, format cells via natural language
- **Cell editing**: Double-click or type to edit; formula bar for formulas
- **Formulas**: `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `IF`, `ROUND`, `CONCATENATE`, and more
- **Cell references**: `A1`, ranges like `A1:B5`, arithmetic expressions
- **Formatting**: Bold, italic, underline, alignment, text/fill colors, number formats (currency, percent)
- **Multi-sheet**: Add, rename, delete, and switch between sheets
- **Clipboard**: Copy, cut, paste with Ctrl+C/X/V
- **Undo/Redo**: Ctrl+Z / Ctrl+Y (50 levels)
- **Fill down**: Ctrl+D
- **Resize**: Drag column and row borders
- **Import/Export**: CSV files
- **Auto-save**: Workbook persisted to localStorage
- **Status bar**: Sum, average, and count for selected range

## Quick start

```bash
cd spreadsheet
npm install
npm run dev
```

Open http://localhost:5173

### AI Copilot

The **✨ AI** panel (right sidebar) works out of the box with a built-in local agent — no API key required.

For GPT-powered responses, start the backend and set `VITE_API_URL`:

```bash
# Terminal 1 — backend
cd backend && pip install fastapi uvicorn httpx pydantic pydantic-settings
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — frontend (proxies /api → backend)
cd spreadsheet && cp .env.example .env && npm run dev
```

Set `OPENAI_API_KEY` in `backend/.env` for GPT tool-calling. Without it, the backend uses the same local rules engine.

**Try asking:**
- "Summarize selection"
- "Add sum formula for B2:E2 in F2"
- "Format header row bold"
- "What is the total profit?"

**Shortcut:** `Ctrl+Shift+A` toggles the AI panel.

## Commands

```bash
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
npm test           # Run tests
npm run typecheck  # TypeScript check
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Arrow keys | Move selection |
| Shift + Arrow | Extend selection |
| Enter | Move down |
| Tab | Move right |
| F2 | Edit cell |
| Delete / Backspace | Clear selection |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+C / X / V | Copy / Cut / Paste |
| Ctrl+D | Fill down |
| Home / End | Jump to row start/end |

## Demo workbook

On first visit, a sample budget workbook with formulas is loaded automatically.
