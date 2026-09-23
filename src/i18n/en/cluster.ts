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

/** Cluster management and realtime monitoring. */
export const cluster: Catalog = {
  '总节点数': 'Total nodes',
  '数据节点': 'DataNode',
  '配置节点': 'ConfigNode',
  '暂无数据节点': 'No DataNode',
  '暂无配置节点': 'No ConfigNode',
  '区域 ID': 'Region ID',
  'Series 槽': 'Series slot',
  'Time 槽': 'Time slot',
  'RPC 地址': 'RPC address',
  '创建时间': 'Create time',
  'TsFile 大小': 'TsFile size',
  '压缩比': 'Compression ratio',
  '区域级槽位分配与存储用量，每 5 秒刷新一次。': 'Region-level slot allocation and storage usage, refreshed every 5 seconds.',
  '暂无区域数据': 'No region data',
  '查询成功，当前集群还没有区域。': 'The query succeeded, and the cluster has no regions yet.',
  '获取区域状态失败: {msg}': 'Failed to get region status: {msg}',
};
