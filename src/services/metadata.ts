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

import { queryTableRows } from './rest';
import type {
  NodeInfo,
  ServiceInfo,
  ConnectionInfo,
  CurrentQuery,
  PipeInfo,
} from '../types/api';

const fromSchema = (table: string, where?: string) =>
  queryTableRows(`SELECT * FROM information_schema.${table}${where ? ` WHERE ${where}` : ''}`);

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

export const getDatabases = async (): Promise<string[]> => {
  const rows = await fromSchema('databases');
  return rows.map((row) => row.database);
};

export const getTables = async (database?: string): Promise<any[]> => {
  const rows = await fromSchema('tables', database ? `database=${quote(database)}` : undefined);
  return rows.map((row) => ({
    database: row.database,
    table: row.table_name,
    table_type: row.table_type,
    status: row.status,
  }));
};

export const getColumns = async (database?: string, table?: string): Promise<any[]> => {
  const conditions: string[] = [];
  if (database) conditions.push(`database=${quote(database)}`);
  if (table) conditions.push(`table_name=${quote(table)}`);
  const rows = await fromSchema('columns', conditions.length ? conditions.join(' AND ') : undefined);
  return rows.map((row) => ({
    database: row.database,
    table: row.table_name,
    column: row.column_name,
    data_type: row.datatype,
    column_type: row.category,
  }));
};

export const getNodes = async (): Promise<NodeInfo[]> => {
  const rows = await fromSchema('nodes');
  return rows.map(
    (row) =>
      ({
        nodeId: String(row.node_id),
        nodeType: row.node_type,
        status: row.status,
        internalAddress: row.internal_address,
        internalPort: row.internal_port,
        version: row.version,
        buildInfo: row.build_info,
      }) as NodeInfo,
  );
};

export const getCurrentQueries = async (): Promise<CurrentQuery[]> => {
  const rows = await fromSchema('current_queries');
  return rows.map(
    (row) =>
      ({
        queryId: row.query_id,
        state: row.state,
        startTime: row.start_time,
        endTime: row.end_time,
        dataNodeId: row.datanode_id,
        costTime: row.cost_time,
        statement: row.statement,
        userName: row.user,
        clientIp: row.client_ip,
      }) as CurrentQuery,
  );
};

export const getConnections = async (): Promise<ConnectionInfo[]> => {
  const rows = await fromSchema('connections');
  return rows.map(
    (row) =>
      ({
        dataNodeId: row.datanode_id,
        sessionId: row.session_id,
        userName: row.user_name,
        lastActiveTime: row.last_active_time,
        clientIp: row.client_ip,
      }) as ConnectionInfo,
  );
};

export const getServices = async (): Promise<ServiceInfo[]> => {
  const rows = await fromSchema('services');
  return rows.map(
    (row) =>
      ({
        serviceName: row.service_name,
        dataNodeId: row.datanode_id,
        state: row.state,
      }) as ServiceInfo,
  );
};

export const getPipes = async (): Promise<PipeInfo[]> => {
  const rows = await fromSchema('pipes');
  return rows.map(
    (row) =>
      ({
        pipeId: row.id,
        creationTime: row.creation_time,
        state: row.state,
        pipeSource: row.pipe_source,
        pipeProcessor: row.pipe_processor,
        pipeSink: row.pipe_sink,
        exceptionMessage: row.exception_message,
        remainingEventCount: row.remaining_event_count,
        estimatedRemainingSeconds: row.estimated_remaining_seconds,
        isDegraded: row.is_degraded,
      }) as PipeInfo,
  );
};

export const getDiskUsage = async (): Promise<any[]> => {
  const rows = await fromSchema('table_disk_usage');
  return rows.map((row) => ({
    database: row.database,
    table: row.table_name,
    dataNodeId: row.datanode_id,
    regionId: row.region_id,
    partition: row.time_partition,
    diskUsage: row.size_in_bytes,
  }));
};
