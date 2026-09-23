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

import { query, queryTableRows, assertRestOk } from './rest';
import { shapeResult } from '../utils/queryResult';
import { normalizeDevicePath } from '../utils/path';
import type { ShapedResult } from '../utils/queryResult';
import type { ClusterReads, QualityReads, Readout } from '../utils/analysis';

const describe = (error: any): string => error?.response?.data?.message || error?.message || '请求失败';

/** Rows by the server's own column titles; the time axis arrives as `__time`, never as a value column. */
const toRows = (shaped: ShapedResult): Record<string, unknown>[] =>
  shaped.rows.map((row) => {
    const named: Record<string, unknown> = {};
    shaped.fields.forEach((field) => {
      if (field.key === '__time') named.__time = row.__time;
      else named[field.title] = row[field.key];
    });
    return named;
  });

/**
 * A statement that came back non-200 stays visible as `ok: false`. That is why these helpers never throw
 * and why the callers use plain `Promise.all`: a rejection is data here, not an exception to propagate.
 */
const readTree = async (label: string, sql: string, rowLimit = 20000): Promise<Readout> => {
  try {
    const result = await query(sql, rowLimit);
    assertRestOk(result);
    return { label, sql, ok: true, rows: toRows(shapeResult(result)) };
  } catch (error) {
    return { label, sql, ok: false, error: describe(error), rows: [] };
  }
};

const readTable = async (label: string, sql: string): Promise<Readout> => {
  try {
    return { label, sql, ok: true, rows: await queryTableRows(sql) };
  } catch (error) {
    return { label, sql, ok: false, error: describe(error), rows: [] };
  }
};

export const readCluster = (): Promise<ClusterReads> =>
  Promise.all([
    readTree('运行参数', 'SHOW VARIABLES'),
    readTree('数据库列表', 'SHOW DATABASES'),
    readTree('Region 列表', 'SHOW REGIONS'),
    readTable('节点状态', 'SELECT node_id, node_type, status, version FROM information_schema.nodes'),
    readTree('持续查询', 'SHOW CONTINUOUS QUERIES'),
    readTree('触发器', 'SHOW TRIGGERS'),
  ]).then(([variables, databases, regions, nodes, cqs, triggers]) => ({
    variables,
    databases,
    regions,
    nodes,
    cqs,
    triggers,
  }));

/**
 * A path is interpolated into statements, so it only ever reaches the server in the bare dotted form
 * IoTDB accepts without quoting -- see `normalizePath()` in utils/path.
 */
export const WINDOWS: Record<string, { label: string; duration: string; step: string; spanMs: number }> = {
  '24h': { label: '近 24 小时', duration: '24h', step: '1h', spanMs: 86400000 },
  '7d': { label: '近 7 天', duration: '7d', step: '1d', spanMs: 604800000 },
  '30d': { label: '近 30 天', duration: '30d', step: '1d', spanMs: 2592000000 },
};

export interface QualityOptions {
  path: string;
  windowKey: keyof typeof WINDOWS | string;
  deviceLimit: number;
  pointLimit: number;
}

/**
 * Devices, then per-device raw points. The device names come from `SHOW DEVICES` but are still shape
 * checked before interpolation -- a name the quoting rules cannot express is dropped rather than sent.
 */
export async function readQuality(options: QualityOptions): Promise<QualityReads> {
  const { path, deviceLimit, pointLimit } = options;
  const window = WINDOWS[options.windowKey] || WINDOWS['7d'];

  const devices = await readTree(
    '数据设备清单',
    `SHOW DEVICES ${path}.** LIMIT ${Math.max(1, Math.min(50, Math.trunc(deviceLimit)))}`
  );
  const usable = devices.rows
    .map((row) => String(row.Device ?? ''))
    .filter((device) => normalizeDevicePath(device) !== null);

  const [last, buckets, ...points] = await Promise.all([
    readTree('最近值', `SELECT last * FROM ${path}.**`),
    readTree(
      '分桶计数',
      `SELECT count(*) FROM ${path}.** GROUP BY ([now() - ${window.duration}, now()), ${window.step})`
    ),
    ...usable.map((device) => readTree(device, `SELECT * FROM ${device} LIMIT ${Math.max(1, Math.min(5000, Math.trunc(pointLimit)))}`)),
  ]);

  return { path, devices, last, buckets, points };
}
