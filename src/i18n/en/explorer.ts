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

/** Path explorer and latest values. */
export const explorer: Catalog = {
  '设备': 'Device',
  '时间序列': 'Timeseries',
  '内部节点': 'Internal node',
  '展开路径失败: {msg}': 'Failed to expand path: {msg}',
  '加载路径失败: {msg}': 'Failed to load paths: {msg}',
  '加载子节点失败: {msg}': 'Failed to load child nodes: {msg}',
  '请输入 root. 开头的路径（末尾的 .* / .** 会被当作整棵子树）': 'Enter a path starting with root. (a trailing .* / .** is treated as the whole subtree)',
  '没有匹配的时间序列': 'No matching timeseries',
  '搜索失败: {msg}': 'Search failed: {msg}',
  '节点信息': 'Node info',
  '路径树': 'Path tree',
  '重新读取': 'Reload',
  '点击左侧树中的节点查看其信息': 'Click a node in the tree on the left to view its information',
  '部分信息读取失败': 'Some information failed to load',
  '搜索路径，如 root.sg 或 root.sg.**': 'Search paths, e.g. root.sg or root.sg.**',
  '搜索结果：{path}.** ({n})': 'Search results: {path}.** ({n})',
  '命中超过 {limit} 条，只显示前 {limit} 条': 'More than {limit} matches, showing only the first {limit}',
  '子节点': 'Child nodes',
  '完整路径': 'Full path',
  '下属时间序列': 'Timeseries under this node',
  '（仅显示前 {n} 条）': '(Showing only the first {n})',
  '最新值': 'Latest Values',
  '最近 {n} 行数据': 'Latest {n} rows',
  '该节点暂无数据行': 'No data rows for this node',
  '节点类型': 'Node type',
  '所属数据库': 'Database',
  '数据类型': 'Data type',
  '编码': 'Encoding',
  '压缩': 'Compression',
  '标签': 'Tags',
  '属性': 'Attributes',
  '别名': 'Alias',
  '视图类型': 'View type',
  '死区': 'Deadband',
  '时间序列数': 'Timeseries count',
  '设备数': 'Device count',
  '对齐存储': 'Aligned storage',
  '模板': 'Template',
  'Schema 副本因子': 'Schema replication factor',
  'Data 副本因子': 'Data replication factor',
  '时间分区间隔': 'Time partition interval',
  '最新值面板': 'Latest values panel',
  '暂无最新值数据': 'No latest value data',
  '获取最新值失败: {msg}': 'Failed to get latest values: {msg}',
};
