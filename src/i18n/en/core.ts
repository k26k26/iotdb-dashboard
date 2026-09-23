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

import type { Catalog } from './types';

/** Dashboard, SQL query, query center, visualization and the chart component. */
export const core: Catalog = {
  'IoTDB 仪表盘': 'IoTDB dashboard',
  '部分数据加载失败': 'Some data failed to load',
  '节点数量': 'Node count',
  '服务数量': 'Service count',
  '当前连接': 'Active connections',
  '运行中查询': 'Running queries',
  '连接': 'Connection',
  '节点概览': 'Node overview',
  '服务状态': 'Service status',
  '暂无节点数据': 'No node data',
  '暂无服务数据': 'No service data',
  '暂无运行中查询': 'No running queries',
  '暂无连接': 'No connections',
  'SQL 查询': 'SQL Query',
  '请输入 SQL 语句': 'Please enter a SQL statement',
  '查询成功，返回 {n} 行': 'Query succeeded, {n} rows returned',
  '查询失败: {reason}': 'Query failed: {reason}',
  '执行': 'Run',
  '清空': 'Clear',
  '导出 CSV': 'Export CSV',
  '结果表格': 'Result table',
  '时序曲线': 'Time series chart',
  '结果没有时间轴，无法绘制时序曲线': 'The result has no time axis, so a time series chart cannot be drawn',
  '查询中心': 'Query Center',
  '获取查询列表失败': 'Failed to load query list',
  '查询已停止': 'Query stopped',
  '停止失败: {reason}': 'Failed to stop query: {reason}',
  '开始时间': 'Start time',
  '耗时 (ms)': 'Elapsed (ms)',
  '停止': 'Stop',
  '可视化看板': 'Visualization board',
  '图表标题': 'Chart title',
  '输入 SQL': 'Enter SQL',
  '添加图表': 'Add chart',
  '新图表': 'New chart',
  '图表添加成功': 'Chart added',
  '查询没有返回数据，请确认路径与设备是否存在': 'The query returned no data; check that the path and device exist',
  '查询没有返回数值列': 'The query returned no numeric column',
  '异常点': 'Anomaly',
};
