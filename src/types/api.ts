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

export interface ConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface QueryResult {
  expressions: string[];
  column_names: string[];
  data_types: string[];
  timestamps: number[];
  values?: any[][];
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: number;
  duration?: number;
  rowCount?: number;
}

export interface NodeInfo {
  nodeId: string;
  nodeType: 'CONFIG_NODE' | 'DATA_NODE';
  status: string;
  internalAddress: string;
  internalPort: number;
}

export interface DatabaseInfo {
  database: string;
  schema: string;
}

export interface TimeseriesInfo {
  timeseries: string;
  datatype: string;
  encoding: string;
  compression: string;
}

export interface ServiceInfo {
  serviceType: string;
  status: string;
}

export interface ConnectionInfo {
  clientIp: string;
  username: string;
}

export interface CurrentQuery {
  queryId: string;
  sql: string;
  startTime: number;
  elapsedTime: number;
}

export interface PipeInfo {
  pipeName: string;
  pipeId: string;
  status: string;
  sourceDatabase?: string;
  sinkDatabase?: string;
}
