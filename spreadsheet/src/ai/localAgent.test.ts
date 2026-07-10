import { describe, it, expect } from 'vitest';
import { localAgentReply } from './localAgent';
import type { WorkbookContextPayload } from './types';

const context: WorkbookContextPayload = {
  activeSheet: 'Budget',
  sheets: ['Budget', 'Formulas'],
  selection: {
    start_row: 0,
    start_col: 0,
    end_row: 3,
    end_col: 5,
    start_address: 'A1',
    end_address: 'F4',
  },
  used_range_csv: 'Item,Q1,Q2\nRevenue,12000,14500\nExpenses,8000,9200',
  selection_csv: 'Item,Q1,Q2\nRevenue,12000,14500',
};

describe('localAgent', () => {
  it('adds sum formula', () => {
    const res = localAgentReply('add sum formula for B2:E2 in F2', context);
    expect(res.actions).toHaveLength(1);
    expect(res.actions[0].type).toBe('set_cell');
    expect(res.actions[0].value).toBe('=SUM(B2:E2)');
  });

  it('formats bold', () => {
    const res = localAgentReply('format header row bold', context);
    expect(res.actions[0].type).toBe('format_range');
    expect(res.actions[0].format?.bold).toBe(true);
  });

  it('summarizes data', () => {
    const res = localAgentReply('summarize selection', context);
    expect(res.reply).toContain('Sum');
    expect(res.actions).toHaveLength(0);
  });

  it('answers profit question', () => {
    const res = localAgentReply('what is the total profit?', context);
    expect(res.reply.toLowerCase()).toContain('profit');
  });

  it('creates sheet', () => {
    const res = localAgentReply('create sheet Analysis', context);
    expect(res.actions[0].type).toBe('create_sheet');
  });
});
