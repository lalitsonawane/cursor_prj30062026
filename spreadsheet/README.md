# SheetCraft — Excel Clone

A full-featured browser-based spreadsheet application built with React, TypeScript, and Vite.

## Features

- **Grid**: 200 rows × 26 columns with sticky row/column headers
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
