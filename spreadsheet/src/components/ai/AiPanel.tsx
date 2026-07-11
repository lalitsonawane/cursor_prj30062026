import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../../ai/types';
import { QUICK_PROMPTS } from '../../ai/types';
import { sendAiMessage, checkAiBackend } from '../../ai/aiService';
import { useSpreadsheetStore } from '../../store/spreadsheetStore';
import { toAddress, normalizeSelection } from '../../utils/cellAddress';
import './AiPanel.css';

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

export function AiPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm **SheetCraft AI** — your spreadsheet copilot. Ask me to analyze data, write formulas, or format cells. Try a quick action below.",
      timestamp: Date.now(),
      mode: 'local',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendMode, setBackendMode] = useState<'fireworks' | 'openai' | 'local'>('local');
  const listRef = useRef<HTMLDivElement>(null);

  const aiPanelOpen = useSpreadsheetStore((s) => s.aiPanelOpen);
  const setAiPanelOpen = useSpreadsheetStore((s) => s.setAiPanelOpen);
  const selection = useSpreadsheetStore((s) => s.selection);
  const activeSheet = useSpreadsheetStore((s) => s.getActiveSheet());

  useEffect(() => {
    checkAiBackend().then(setBackendMode);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sel = normalizeSelection(selection);
  const selectionLabel = sel.startRow === sel.endRow && sel.startCol === sel.endCol
    ? toAddress(sel.startRow, sel.startCol)
    : `${toAddress(sel.startRow, sel.startCol)}:${toAddress(sel.endRow, sel.endCol)}`;

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { assistant } = await sendAiMessage(messages, text.trim());
      setMessages((prev) => [...prev, assistant]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          timestamp: Date.now(),
          mode: 'local',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!aiPanelOpen) return null;

  return (
    <aside className="ai-panel">
      <header className="ai-header">
        <div className="ai-header-title">
          <span className="ai-icon">✨</span>
          <div>
            <h2>SheetCraft AI</h2>
            <span className="ai-subtitle">Cursor for Excel</span>
          </div>
        </div>
        <button className="ai-close" onClick={() => setAiPanelOpen(false)} title="Close panel">
          ×
        </button>
      </header>

      <div className="ai-context">
        <span className="context-chip">{activeSheet.name}</span>
        <span className="context-chip">{selectionLabel}</span>
        <span className={`context-chip mode-${backendMode}`}>
          {backendMode === 'fireworks' ? '🔥 Fireworks AI' : backendMode === 'openai' ? 'GPT connected' : 'Local AI'}
        </span>
      </div>

      <div className="ai-messages" ref={listRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ${msg.role}`}>
            {msg.role === 'assistant' && (
              <div className="ai-avatar">AI</div>
            )}
            <div className="ai-bubble">
              <div
                className="ai-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
              />
              {msg.mode && (
                <span className="ai-mode-tag">
                  {msg.mode === 'fireworks' ? 'Fireworks' : msg.mode === 'openai' ? 'GPT' : 'Local'}
                </span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ai-message assistant">
            <div className="ai-avatar">AI</div>
            <div className="ai-bubble loading">
              <span className="dot-pulse" />
              Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="ai-quick-prompts">
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp.label}
            className="quick-prompt"
            onClick={() => handleSend(qp.prompt)}
            disabled={loading}
          >
            {qp.label}
          </button>
        ))}
      </div>

      <form
        className="ai-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
      >
        <textarea
          className="ai-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(input);
            }
          }}
          placeholder="Ask AI to analyze, write formulas, format cells…"
          rows={2}
          disabled={loading}
        />
        <button type="submit" className="ai-send" disabled={loading || !input.trim()}>
          ↑
        </button>
      </form>
    </aside>
  );
}
