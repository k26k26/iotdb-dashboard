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
