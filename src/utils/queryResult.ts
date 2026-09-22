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

import type { QueryResult } from '../types/api';

export interface Field {
  title: string;
  key: string;
}

export interface ShapedResult {
  fields: Field[];
  rows: Record<string, unknown>[];
  hasTime: boolean;
}

export const EMPTY_SHAPED: ShapedResult = { fields: [], rows: [], hasTime: false };

/**
 * /rest/v2/query answers column-oriented: values[colIndex][rowIndex]. Time is only ever in
 * `timestamps`, and only the SHOW-style responses fill `column_names` -- a SELECT comes back
 * with the names in `expressions` instead.
 */
export function shapeResult(result: QueryResult | null): ShapedResult {
  if (!result) return EMPTY_SHAPED;

  const cols = Array.isArray(result.values) ? result.values : [];
  const times = Array.isArray(result.timestamps) ? result.timestamps : [];
  const columnNames = Array.isArray(result.column_names) ? result.column_names : [];
  const expressions = Array.isArray(result.expressions) ? result.expressions : [];
  const named = columnNames.length ? columnNames : expressions;
  const names = named.length ? named : cols.map((_, j) => `column ${j + 1}`);
  const hasTime = times.length > 0;

  const fields: Field[] = [
    ...(hasTime ? [{ title: 'Time', key: '__time' }] : []),
    ...names.map((name, j) => ({ title: name, key: `c${j}` })),
  ];
  const rowCount = hasTime ? times.length : (cols[0]?.length ?? 0);
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const row: Record<string, unknown> = { key: i };
    if (hasTime) row.__time = times[i];
    names.forEach((_, j) => {
      row[`c${j}`] = cols[j]?.[i] ?? null;
    });
    return row;
  });

  return { fields, rows, hasTime };
}

/**
 * The path a query reads from. Everything the result can contain sits underneath it, so repeating it in
 * every label buys nothing -- and a wildcard tail never matches a real column name, hence the trim.
 */
export const fromPathOf = (sql: string): string => {
  const matched = /\bfrom\s+(`[^`]+`|"[^"]+"|'[^']+'|[^\s;)]+)/i.exec(sql);
  if (!matched) return '';
  return matched[1].replace(/\.(?:\*\*|\*)$/, '').replace(/(?:\*\*|\*)$/, '');
};

/** A chart heading: the FROM target, falling back to the statement when the query has no FROM. */
export const chartTitleOf = (sql: string): string => fromPathOf(sql) || sql;

/** Value columns as chart series, named relative to the FROM path so multi-device legends stay readable. */
export const toChartSeries = (shaped: ShapedResult, sql = '') => {
  const prefix = fromPathOf(sql);
  return shaped.fields
    .filter((field) => field.key !== '__time')
    .map((field) => ({
      name:
        prefix && field.title.startsWith(`${prefix}.`)
          ? field.title.slice(prefix.length + 1)
          : field.title,
      data: shaped.rows.map((row) => row[field.key]),
    }));
};
