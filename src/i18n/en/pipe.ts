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

/** Pipe management and external services. */
export const pipe: Catalog = {
  '数据管道管理': 'Pipe management',
  '获取 Pipe 列表失败: {msg}': 'Failed to get pipes: {msg}',
  '创建时间': 'Create time',
  '数据源': 'Source',
  '处理器': 'Processor',
  '数据去向': 'Sink',
  '异常信息': 'Exception message',
  '剩余事件数': 'Remaining events',
  '预计剩余秒数': 'Estimated remaining seconds',
  '已降级': 'Degraded',
  '暂无 Pipe': 'No pipes',
  '查询成功，当前集群没有数据管道；需要时执行 CREATE PIPE 语句创建。': 'The query succeeded; this cluster has no pipes, and a CREATE PIPE statement creates one when needed.',
  '外部服务管理': 'External service management',
  '获取外部服务列表失败: {msg}': 'Failed to get external services: {msg}',
  '外部服务即管道连接器插件，供数据管道的 source / processor / sink 引用；可用 {stmt} 注册自定义 JAR。': 'External services are pipe connector plugins referenced by the source / processor / sink of a pipe; use {stmt} to register a custom JAR.',
  '插件名称': 'Plugin name',
  '类别': 'Category',
  '实现类': 'Implementation class',
  'JAR 包': 'JAR package',
  '加载异常': 'Load error',
  '暂无外部服务': 'No external services',
  '查询成功，当前集群没有可用的连接器插件。': 'The query succeeded; no connector plugins are available in this cluster.',
};
