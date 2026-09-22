/*
 * Copyright 2026 liuyu
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export interface ParsedCsv {
  header: string[];
  rows: string[][];
}

const trimBom = (text: string) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);

/** Minimal RFC-4180 reader: quoted fields may contain commas, newlines and "" escapes. */
export const parseCsv = (text: string): ParsedCsv => {
  const src = trimBom(text);
  const table: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      table.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    table.push(row);
  }

  const nonEmpty = table.filter((r) => r.some((cell) => cell.trim() !== ''));
  const [header = [], ...rows] = nonEmpty;
  return { header: header.map((h) => h.trim()), rows };
};

const escape = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  // A leading =, +, - or @ makes spreadsheet apps evaluate the cell as a formula.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
};

export const toCsv = (header: string[], rows: unknown[][]): string =>
  [header, ...rows].map((line) => line.map(escape).join(',')).join('\r\n');
