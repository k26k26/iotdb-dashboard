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

export const expression = async (params: {
  expression: string[];
  prefixPath: string[];
  condition?: string;
  control?: string;
  startTime: number;
  endTime: number;
}): Promise<any> => {
  const response = await iotdb.post('/grafana/v2/query/expression', params);
  return response.data;
};

export const variable = async (sql: string): Promise<string[]> => {
  const response = await iotdb.post('/grafana/v2/variable', { sql });
  return response.data;
};

export const node = async (paths: string[]): Promise<string[]> => {
  const response = await iotdb.post('/grafana/v2/node', paths);
  return response.data;
};

export const login = async (): Promise<boolean> => {
  try {
    await iotdb.get('/grafana/v2/login');
    return true;
  } catch {
    return false;
  }
};
