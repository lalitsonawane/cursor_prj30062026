import { describe, it, expect } from 'vitest';
import { computeCellValue } from '../formula/evaluator';
import { colToLetter, letterToCol, toAddress, fromAddress } from '../utils/cellAddress';

describe('cellAddress', () => {
  it('converts col to letter', () => {
    expect(colToLetter(0)).toBe('A');
    expect(colToLetter(25)).toBe('Z');
    expect(colToLetter(26)).toBe('AA');
  });

  it('converts letter to col', () => {
    expect(letterToCol('A')).toBe(0);
    expect(letterToCol('Z')).toBe(25);
    expect(letterToCol('AA')).toBe(26);
  });

  it('converts address', () => {
    expect(toAddress(0, 0)).toBe('A1');
    expect(fromAddress('B3')).toEqual({ row: 2, col: 1 });
  });
});

describe('evaluator', () => {
  const cells: Record<string, string> = {
    '0,0': '10',
    '0,1': '20',
    '1,0': '5',
    '1,1': '=A1+B1',
  };

  const getRaw = (r: number, c: number) => cells[`${r},${c}`] ?? '';

  it('evaluates numbers', () => {
    expect(computeCellValue('42', 0, 0, getRaw)).toBe(42);
  });

  it('evaluates SUM', () => {
    expect(computeCellValue('=SUM(A1:B1)', 2, 0, getRaw)).toBe(30);
  });

  it('evaluates arithmetic', () => {
    expect(computeCellValue('=A1*2', 2, 0, getRaw)).toBe(20);
  });

  it('evaluates IF', () => {
    expect(computeCellValue('=IF(A1>5, "yes", "no")', 2, 0, getRaw)).toBe('yes');
  });

  it('evaluates cell reference formula', () => {
    expect(computeCellValue('=A1+B1', 1, 1, getRaw)).toBe(30);
  });

  it('handles AVERAGE', () => {
    expect(computeCellValue('=AVERAGE(A1:B1)', 2, 0, getRaw)).toBe(15);
  });
});
