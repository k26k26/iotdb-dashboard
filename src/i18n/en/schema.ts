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

/** Templates, indexes and UDF management. */
export const schema: Catalog = {
  // Schema templates. 编码 / 压缩 / 数据类型 resolve through the explorer slice, and
  // 操作 / 删除 / 刷新 / 创建 through common, so they are not restated here.
  '获取模板列表失败': 'Failed to load template list',
  '模板创建成功': 'Template created',
  '模板删除成功': 'Template deleted',
  '创建失败: {msg}': 'Create failed: {msg}',
  '删除失败: {msg}': 'Delete failed: {msg}',
  '模板名': 'Template name',
  '确定删除该模板吗？': 'Delete this template?',
  'Schema 模板管理': 'Schema Templates',
  '创建模板': 'Create template',
  '创建 Schema 模板': 'Create Schema Template',
  '请输入模板名': 'Please enter the template name',
  '节点路径': 'Node path',
  '请输入节点路径': 'Please enter the node path',

  // Indexes.
  '库表名 {db}.{tb} 不是合法标识符': 'Database/table name {db}.{tb} is not a valid identifier',
  '{name} 不是合法标识符': '{name} is not a valid identifier',
  '{detail}（本版本服务端未实现索引功能，CREATE/DROP INDEX 一律被拒绝）': '{detail} (this server build does not implement indexing, so CREATE/DROP INDEX is always rejected)',
  '索引创建成功': 'Index created',
  '索引删除成功': 'Index deleted',
  '{db}.{tb} 的索引无法读取': 'Failed to read the indexes of {db}.{tb}',
  '确定删除该索引吗？': 'Delete this index?',
  '{db}.{tb} 上没有索引': 'No indexes on {db}.{tb}',
  '查询成功，这张表当前没有索引。表模型下只有一个系统库 information_schema 时，没有可建索引的用户表。': 'The query succeeded; this table currently has no indexes. Under the table model, when only the system database information_schema exists, there is no user table to index.',
  '服务端拒绝了这条 CREATE INDEX 语句': 'The server rejected this CREATE INDEX statement',
  '索引名': 'Index name',
  '请输入索引名': 'Please enter the index name',
  '仅限字母、数字和下划线，且不能以数字开头': 'Letters, digits and underscores only, and it cannot start with a digit',
  '索引列': 'Index columns',
  '至少选择一个列': 'Select at least one column',
  '目标表：{target}。多选列会拼成 ON {target} a, b。': 'Target table: {target}. Selecting several columns builds ON {target} a, b.',
  '选择要建索引的列': 'Select the columns to index',
  '创建索引': 'Create index',

  // Functions. 函数管理 resolves through the layout slice.
  '获取函数列表失败': 'Failed to load function list',
  '函数名': 'Function name',
};
