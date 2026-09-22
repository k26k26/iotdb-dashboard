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

import iotdb from './iotdb';
import type { QueryResult } from '../types/api';

/**
 * information_schema only exists in the table model, so these statements must go
 * to /rest/table/v1/query — the tree-model endpoint cannot parse them.
 */
export interface TableQueryResult {
  column_names?: string[] | null;
  data_types?: string[] | null;
  values?: any[][] | null;
  code?: number;
  message?: string;
}

// Failed statements still come back as HTTP 200 with an error `code` in the body.
const assertOk = (data: TableQueryResult): TableQueryResult => {
  if (typeof data?.code === 'number' && data.code !== 200) {
    throw new Error(data.message || `IoTDB REST request failed (code ${data.code})`);
  }
  return data;
};

export const queryTable = async (sql: string): Promise<TableQueryResult> => {
  const response = await iotdb.post('/rest/table/v1/query', { sql });
  return assertOk(response.data);
};

export const queryTableRows = async (sql: string): Promise<Record<string, any>[]> => {
  const result = await queryTable(sql);
  const columns = Array.isArray(result.column_names) ? result.column_names : [];
  const rows = Array.isArray(result.values) ? result.values : [];
  return rows.map((row) => Object.fromEntries(columns.map((name, i) => [name, row?.[i]])));
};

export const query = async (sql: string, rowLimit?: number): Promise<QueryResult> => {
  const response = await iotdb.post('/rest/v2/query', { sql, row_limit: rowLimit || 10000 });
  return response.data;
};

export const nonQuery = async (sql: string): Promise<void> => {
  await iotdb.post('/rest/v2/nonQuery', { sql });
};

export const fastLastQuery = async (prefixPaths: string[]): Promise<any> => {
  const response = await iotdb.post('/rest/v2/fastLastQuery', { prefix_paths: prefixPaths });
  return response.data;
};

export const insertTablet = async (data: any): Promise<void> => {
  await iotdb.post('/rest/v2/insertTablet', data);
};

export const insertRecords = async (data: any): Promise<void> => {
  await iotdb.post('/rest/v2/insertRecords', data);
};
