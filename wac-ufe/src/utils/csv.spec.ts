import { toCsv } from './csv';

describe('toCsv', () => {
  it('quotes cells with commas, quotes and line breaks', () => {
    expect(toCsv([['a', 'b,c', 'say "hi"', 'two\nlines', 4.5]])).toEqual('a,"b,c","say ""hi""","two\nlines",4.5\r\n');
  });

  it('defuses spreadsheet formulas', () => {
    expect(toCsv([['=HYPERLINK("x")', '+1', '-2', '@SUM(A1)']])).toEqual(`"'=HYPERLINK(""x"")",'+1,'-2,'@SUM(A1)\r\n`);
  });

  it('keeps negative numbers as numbers', () => {
    expect(toCsv([[-2]])).toEqual('-2\r\n');
  });
});
