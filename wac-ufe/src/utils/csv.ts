/** RFC 4180 CSV. Text that a spreadsheet would run as a formula gets a leading apostrophe. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (value: string | number) => {
    if (typeof value === 'number') return String(value);
    const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map(row => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

/** Saves text as a file; for CSV a BOM makes Excel read the UTF-8 diacritics correctly. */
export function downloadText(fileName: string, text: string, type = 'text/csv') {
  const parts = type === 'text/csv' ? ['﻿', text] : [text];
  const url = URL.createObjectURL(new Blob(parts, { type: `${type};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
