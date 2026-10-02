import { describe, expect, it } from 'vitest';
import { createSeed } from '@/domain/seed';
import { csvCell, filterPipeline, pipelineRows, type PipelineFilters } from './pipeline-model';

const state = createSeed(0);
const filters: PipelineFilters = {
  search: '',
  status: 'all',
  stage: 'all',
  stageGroup: '',
  backing: 'all',
  origin: 'all',
};
const rows = pipelineRows(state, 'emp_gulf_meridian', state.clock.anchor);

describe('employer pipeline views', () => {
  it('keeps employers separate and derives the populated seed', () => {
    expect(rows).toHaveLength(9);
    expect(pipelineRows(state, 'emp_northwind', state.clock.anchor)).toEqual([]);
    expect(rows.filter((row) => row.status === 'settled')).toHaveLength(2);
    expect(rows.filter((row) => row.status === 'blocked')).toHaveLength(1);
  });

  it('includes the document blocker and personal approval in the attention queue', () => {
    expect(
      filterPipeline(rows, { ...filters, status: 'attention' }).map((row) => row.hire.id),
    ).toEqual(['hire_seed_01', 'hire_seed_04']);
  });

  it('combines origin, backing and case-insensitive role search', () => {
    expect(
      filterPipeline(rows, {
        ...filters,
        search: '  DATA SCIENTIST  ',
        origin: 'Singapore',
        backing: 'backed',
      }).map((row) => row.hire.fullName),
    ).toEqual(['Mei Lin Tan']);
    expect(filterPipeline(rows, { ...filters, search: 'DATA SCIENTIST', origin: 'India' })).toEqual(
      [],
    );
  });

  it('groups visa and identity stages without including housing or settled hires', () => {
    const result = filterPipeline(rows, { ...filters, stageGroup: 'residence_visa' });
    expect(result.map((row) => row.hire.id)).toEqual([
      'hire_seed_02',
      'hire_seed_04',
      'hire_seed_05',
      'hire_seed_09',
    ]);
    expect(
      filterPipeline(rows, { ...filters, stageGroup: 'settled' }).map((row) => row.hire.id),
    ).toEqual(['hire_seed_03', 'hire_seed_07']);
  });
});

describe('employer CSV download cells', () => {
  it('escapes separators and quotes and prevents user-entered formulas', () => {
    expect(csvCell('Name, "Quoted"')).toBe('"Name, ""Quoted"""');
    expect(csvCell('=HYPERLINK("https://example.test")')).toBe(
      '"\'=HYPERLINK(""https://example.test"")"',
    );
    expect(csvCell('@SUM(1)')).toBe('"\'@SUM(1)"');
    expect(csvCell(21)).toBe('"21"');
  });
});
