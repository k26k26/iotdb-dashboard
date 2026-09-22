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

import { query } from './rest';

const safeValues = (result: any): any[][] => {
  return Array.isArray(result?.values) ? result.values : [];
};

export const getDatabases = async (): Promise<string[]> => {
  const result = await query('SELECT * FROM information_schema.databases');
  return safeValues(result).map((row) => row[0]);
};

export const getTables = async (database?: string): Promise<any[]> => {
  const sql = database
    ? `SELECT * FROM information_schema.tables WHERE database='${database}'`
    : 'SELECT * FROM information_schema.tables';
  const result = await query(sql);
  return safeValues(result).map((row) => ({
    database: row[0],
    table: row[1],
    table_type: row[2],
  }));
};

export const getColumns = async (database?: string, table?: string): Promise<any[]> => {
  let sql = 'SELECT * FROM information_schema.columns';
  const conditions: string[] = [];
  if (database) conditions.push(`database='${database}'`);
  if (table) conditions.push(`table='${table}'`);
  if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
  const result = await query(sql);
  return safeValues(result).map((row) => ({
    database: row[0],
    table: row[1],
    column: row[2],
    data_type: row[3],
    column_type: row[4],
  }));
};

export const getNodes = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.nodes');
  return safeValues(result).map((row) => ({
    node_id: row[0],
    node_type: row[1],
    status: row[2],
    internal_address: row[3],
    internal_port: row[4],
  }));
};

export const getDataNodes = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.data_nodes');
  return safeValues(result).map((row) => ({
    node_id: row[0],
    status: row[1],
    internal_address: row[2],
    internal_port: row[3],
  }));
};

export const getConfigNodes = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.config_nodes');
  return safeValues(result).map((row) => ({
    node_id: row[0],
    status: row[1],
    internal_address: row[2],
    internal_port: row[3],
  }));
};

export const getCurrentQueries = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.current_queries');
  return safeValues(result).map((row) => ({
    query_id: row[0],
    sql: row[1],
    start_time: row[2],
    elapsed_time: row[3],
  }));
};

export const getConnections = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.connections');
  return safeValues(result).map((row) => ({
    client_ip: row[0],
    username: row[1],
  }));
};

export const getServices = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.services');
  return safeValues(result).map((row) => ({
    service_type: row[0],
    status: row[1],
  }));
};

export const getPipes = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.pipes');
  return safeValues(result).map((row) => ({
    pipe_name: row[0],
    pipe_id: row[1],
    status: row[2],
    source_database: row[3],
    sink_database: row[4],
  }));
};

export const getDiskUsage = async (): Promise<any[]> => {
  const result = await query('SELECT * FROM information_schema.table_disk_usage');
  return safeValues(result).map((row) => ({
    database: row[0],
    table: row[1],
    partition: row[2],
    disk_usage: row[3],
  }));
};
