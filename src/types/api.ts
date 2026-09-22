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
  /** Only present on a rejected statement, which still arrives as HTTP 200. */
  code?: number;
  message?: string;
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
  nodeType: 'ConfigNode' | 'DataNode';
  status: string;
  internalAddress: string;
  internalPort: number;
  version?: string;
  buildInfo?: string;
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

/** information_schema.services */
export interface ServiceInfo {
  serviceName: string;
  dataNodeId: number | null;
  state: string;
}

/** information_schema.connections */
export interface ConnectionInfo {
  dataNodeId: string;
  sessionId: string;
  userName: string;
  lastActiveTime: number;
  clientIp: string;
}

/** information_schema.current_queries */
export interface CurrentQuery {
  queryId: string;
  state: string;
  startTime: number;
  endTime: number | null;
  dataNodeId: number | null;
  costTime: number | null;
  statement: string;
  userName: string;
  clientIp: string;
}

/** LIST USER -- `LIST ROLE` has no counterpart for per-user grants on this grammar. */
export interface UserInfo {
  userId: number;
  username: string;
}

/** SHOW REGIONS -- per-region slot assignment and storage usage. */
export interface RegionInfo {
  regionId: number;
  type: string;
  status: string;
  database: string;
  seriesSlotNum: number;
  timeSlotNum: number;
  dataNodeId: number;
  rpcAddress: string;
  rpcPort: number;
  role: string;
  createTime: string;
  tsFileSize: string;
  /** `NaN` for schema regions, otherwise a number. */
  compressionRatio: string;
}

/** SHOW PIPEPLUGINS -- the connector plugins IoTDB uses to talk to external systems. */
export interface PipePluginInfo {
  pluginName: string;
  pluginType: string;
  className: string;
  pluginJar: string;
  exceptionMessage: string;
}

/** SHOW TRIGGERS -- a trigger is loaded on the DataNode as a Java class, not as SQL. */
export interface TriggerInfo {
  triggerName: string;
  event: string;
  type: string;
  state: string;
  pathPattern: string;
  className: string;
  nodeId: string;
}

/** SHOW CONTINUOUS QUERIES -- `Query` is the statement text the server stored. */
export interface CqInfo {
  cqId: string;
  query: string;
  state: string;
}

/**
 * information_schema.configurations -- the cluster's parameters. The tree model's `SHOW VARIABLES`
 * answers the same rows, so there is only one configuration surface to show.
 */
export interface ConfigInfo {
  variable: string;
  value: string;
}

/** information_schema.pipes */
export interface PipeInfo {
  pipeId: string;
  /** Epoch millis or an ISO string, depending on which REST model served the row. */
  creationTime: string | number;
  state: string;
  pipeSource: string;
  pipeProcessor: string;
  pipeSink: string;
  exceptionMessage: string | null;
  remainingEventCount: number | null;
  estimatedRemainingSeconds: number | null;
  isDegraded: boolean;
}
