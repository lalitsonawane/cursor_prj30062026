import type { AiChatResponse, ChatMessage, WorkbookContextPayload } from './types';
import { selectionToCsv, sheetsToCsv } from './types';
import { useSpreadsheetStore } from '../store/spreadsheetStore';
import { toAddress, normalizeSelection } from '../utils/cellAddress';
import { executeAiActions } from './actionExecutor';
import { localAgentReply } from './localAgent';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function buildWorkbookContext(): WorkbookContextPayload {
  const state = useSpreadsheetStore.getState();
  const sheet = state.getActiveSheet();
  const sel = normalizeSelection(state.selection);

  return {
    activeSheet: sheet.name,
    sheets: state.sheets.map((s) => s.name),
    selection: {
      start_row: sel.startRow,
      start_col: sel.startCol,
      end_row: sel.endRow,
      end_col: sel.endCol,
      start_address: toAddress(sel.startRow, sel.startCol),
      end_address: toAddress(sel.endRow, sel.endCol),
    },
    used_range_csv: sheetsToCsv(sheet),
    selection_csv: selectionToCsv(sheet, sel),
  };
}

export async function sendAiMessage(
  messages: ChatMessage[],
  userText: string,
): Promise<{ assistant: ChatMessage; applied: string[] }> {
  const context = buildWorkbookContext();
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content: userText,
    timestamp: Date.now(),
  };

  let response: AiChatResponse;

  try {
    if (API_BASE) {
      const res = await fetch(`${API_BASE}/v1/spreadsheet/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context,
        }),
      });
      if (res.ok) {
        response = await res.json();
      } else {
        response = localAgentReply(userText, context);
      }
    } else {
      response = localAgentReply(userText, context);
    }
  } catch {
    response = localAgentReply(userText, context);
  }

  const applied = response.actions.length ? executeAiActions(response.actions) : [];

  let reply = response.reply;
  if (applied.length) {
    reply += `\n\n✓ ${applied.join('\n✓ ')}`;
  }

  const assistant: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: reply,
    timestamp: Date.now(),
    actions: response.actions,
    mode: response.mode,
  };

  return { assistant, applied };
}

export async function checkAiBackend(): Promise<'online' | 'local'> {
  if (!API_BASE) return 'local';
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok ? 'online' : 'local';
  } catch {
    return 'local';
  }
}
