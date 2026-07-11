/** Client-side AI agent — works offline without API keys. Mirrors backend local rules. */

import type { AiChatResponse, WorkbookContextPayload } from './types';

export function localAgentReply(text: string, context: WorkbookContextPayload): AiChatResponse {
  const q = text.toLowerCase().trim();
  const csv = context.selection_csv || context.used_range_csv;
  const lines = csv ? csv.split('\n').filter((l) => l.trim()) : [];

  if (q.includes('bold') || q.includes('format header') || q.includes('make bold')) {
    const range = extractRange(q) || 'A1:F1';
    return {
      reply: `Applied bold formatting to ${range}.`,
      actions: [{ type: 'format_range', range, format: { bold: true } }],
      mode: 'local',
    };
  }

  if (q.includes('currency') || q.includes('dollar')) {
    const range = extractRange(q) || context.selection.start_address;
    return {
      reply: `Formatted ${range} as currency.`,
      actions: [{ type: 'format_range', range, format: { numberFormat: 'currency' } }],
      mode: 'local',
    };
  }

  const sumMatch = q.match(/sum\s+(?:of\s+)?([a-z]+\d+:[a-z]+\d+)/i);
  if (sumMatch || (q.includes('sum') && q.includes('formula'))) {
    const range = sumMatch ? sumMatch[1].toUpperCase() : 'B2:E2';
    const target = extractAddress(q) || 'F2';
    return {
      reply: `Added =SUM(${range}) in ${target}.`,
      actions: [{ type: 'set_cell', address: target, value: `=SUM(${range})` }],
      mode: 'local',
    };
  }

  const setMatch = q.match(/(?:set|put|write)\s+(.+?)\s+(?:in|to)\s+([a-z]+\d+)/i);
  if (setMatch) {
    const [, val, addr] = setMatch;
    return {
      reply: `Set ${addr.toUpperCase()} to ${val.trim()}.`,
      actions: [{ type: 'set_cell', address: addr.toUpperCase(), value: val.trim() }],
      mode: 'local',
    };
  }

  const sheetMatch = q.match(/(?:create|add|new)\s+(?:sheet|tab)\s+(?:named?\s+)?['"]?(\w+)['"]?/i);
  if (sheetMatch || q.includes('new sheet')) {
    const name = sheetMatch ? sheetMatch[1] : 'Summary';
    return {
      reply: `Created sheet "${name.charAt(0).toUpperCase() + name.slice(1)}".`,
      actions: [{ type: 'create_sheet', name: name.charAt(0).toUpperCase() + name.slice(1) }],
      mode: 'local',
    };
  }

  if (q.includes('clear') || q.includes('delete')) {
    const range = extractRange(q) || `${context.selection.start_address}:${context.selection.end_address}`;
    return {
      reply: `Cleared range ${range}.`,
      actions: [{ type: 'clear_range', range }],
      mode: 'local',
    };
  }

  if (q.includes('profit')) {
    return {
      reply: 'Total profit is in **F4** (`=SUM(B4:E4)`). Q1 profit is in **B4** (`=B2-B3`). Select F4 to see the grand total.',
      actions: [],
      mode: 'local',
    };
  }

  if (['analyze', 'summarize', 'summary', 'insight', 'tell me', 'explain'].some((w) => q.includes(w))
    || (q.includes('what') && !q.includes('profit'))) {
    return { reply: summarizeCsv(lines, context), actions: [], mode: 'local' };
  }

  if (q.includes('help') || q === '?') {
    return {
      reply: `I'm **SheetCraft AI** — your spreadsheet copilot (like Cursor for Excel).

Try:
• **Summarize selection** — analyze selected data
• **Add sum formula for B2:E2 in F2**
• **Format header row bold**
• **Set 100 in C5**
• **Create sheet Summary**
• **What is the total profit?**

Configure \`VITE_API_URL\` to connect to the backend for GPT-powered responses.`,
      actions: [],
      mode: 'local',
    };
  }

  return {
    reply: 'I can analyze data, write formulas, and format cells. Try "summarize selection", "add sum formula for B2:E2 in F2", or "format A1:F1 bold".',
    actions: [],
    mode: 'local',
  };
}

function extractRange(text: string): string | null {
  const m = text.match(/([a-z]+\d+:[a-z]+\d+)/i);
  return m ? m[1].toUpperCase() : null;
}

function extractAddress(text: string): string | null {
  const m = text.match(/\b([a-z]+\d+)\b/i);
  return m ? m[1].toUpperCase() : null;
}

function summarizeCsv(lines: string[], context: WorkbookContextPayload): string {
  if (!lines.length) {
    return `No data in selection (${context.selection.start_address}). Select a range with data first.`;
  }

  const nums: number[] = [];
  for (const line of lines) {
    for (const cell of line.split(',')) {
      const cleaned = cell.trim().replace(/^"|"$/g, '').replace(/[$,]/g, '');
      const n = parseFloat(cleaned);
      if (!isNaN(n)) nums.push(n);
    }
  }

  const parts: string[] = [];
  parts.push(`**Selection:** ${context.selection.start_address}`);
  if (context.selection.end_address !== context.selection.start_address) {
    parts[parts.length - 1] += ` → ${context.selection.end_address}`;
  }
  parts.push(`**Rows:** ${lines.length}`);

  if (nums.length) {
    const sum = nums.reduce((a, b) => a + b, 0);
    parts.push(`**Numbers found:** ${nums.length}`);
    parts.push(`**Sum:** ${sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
    parts.push(`**Average:** ${(sum / nums.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
    parts.push(`**Min:** ${Math.min(...nums).toLocaleString()} | **Max:** ${Math.max(...nums).toLocaleString()}`);
  } else {
    parts.push('**Preview:**\n' + lines.slice(0, 5).join('\n'));
  }

  return parts.join('\n');
}
