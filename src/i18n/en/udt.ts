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

/** Triggers and continuous queries. */
export const udt: Catalog = {
  '触发器管理': 'Trigger management',
  '创建触发器': 'Create trigger',
  '暂无触发器': 'No triggers',
  '触发器名': 'Trigger name',
  '事件': 'Event',
  '实现类': 'Implementation class',
  'JAR 地址': 'JAR address',
  '获取触发器列表失败: {msg}': 'Failed to get triggers: {msg}',
  '触发器创建成功': 'Trigger created',
  '触发器删除成功': 'Trigger deleted',
  '创建失败: {msg}': 'Create failed: {msg}',
  '删除失败: {msg}': 'Delete failed: {msg}',
  '确定删除该触发器吗？': 'Delete this trigger?',
  '服务端拒绝了这条 CREATE 语句': 'The server rejected this CREATE statement',
  '请输入触发器名': 'Enter a trigger name',
  '请输入触发器类的全限定名': 'Enter the fully qualified name of the trigger class',
  '请输入路径': 'Enter a path',
  '仅限字母、数字和下划线，且不能以数字开头': 'Letters, digits and underscores only, and it cannot start with a digit',
  '仅允许字母、数字、下划线和点，例如 root.sg.d1': 'Only letters, digits, underscores and dots are allowed, e.g. root.sg.d1',
  '本版本仅支持插入事件，DELETE 事件会被服务端拒绝。': 'This version supports insert events only; DELETE events are rejected by the server.',
  '触发器由 DataNode 加载的 Java 类实现，不是 SQL 语句。': 'A trigger is implemented by a Java class loaded by the DataNode, not by a SQL statement.',
  '留空则由 DataNode 自行加载已放置的类；本机只信任 file: 前缀，所以填 DataNode 上的绝对路径，例如 file:/data/trigger/my.jar。': 'Leave it empty to let the DataNode load a class it has already placed; this server only trusts the file: prefix, so enter an absolute path on the DataNode, e.g. file:/data/trigger/my.jar.',
  '查询成功，当前集群没有触发器。触发器是 DataNode 加载的 Java 类：要么把 jar 放进 DataNode 的触发器目录再创建，要么在下方「JAR 地址」里给出 URI —— 本机 trusted_uri_pattern 为 file:.*，只接受 DataNode 本地路径。本机也不支持 START / STOP TRIGGER，改配置只能删除后重建。':
    'The query succeeded; this cluster has no triggers. A trigger is a Java class loaded by the DataNode: either put the jar into the trigger directory of the DataNode and then create it, or give a URI in the "JAR address" field below — trusted_uri_pattern on this server is file:.*, so only paths local to the DataNode are accepted. START / STOP TRIGGER is not supported here either, so changing the configuration means dropping the trigger and creating it again.',
  '连续查询管理': 'Continuous query management',
  '创建连续查询': 'Create continuous query',
  '创建 CQ': 'Create CQ',
  '暂无连续查询': 'No continuous queries',
  'CQ 名称': 'CQ name',
  '语句': 'Statement',
  '获取连续查询列表失败: {msg}': 'Failed to get continuous queries: {msg}',
  '连续查询创建成功': 'Continuous query created',
  '连续查询删除成功': 'Continuous query deleted',
  '确定删除该连续查询吗？': 'Delete this continuous query?',
  '服务端拒绝了这条 CREATE CONTINUOUS QUERY 语句': 'The server rejected this CREATE CONTINUOUS QUERY statement',
  '请输入名称': 'Enter a name',
  'SELECT 表达式': 'SELECT expression',
  '请输入聚合表达式': 'Enter an aggregate expression',
  '仅允许测点名、函数、* 与运算符，不要带引号或分号': 'Only measurement names, functions, * and operators are allowed; leave out quotes and semicolons',
  '聚合函数按窗口计算，例如 max_value(temperature)。': 'Aggregate functions are computed per window, e.g. max_value(temperature).',
  'INTO 设备路径': 'INTO device path',
  '请输入目标设备路径': 'Enter the target device path',
  '仅允许以 root 开头的路径字符': 'Only path characters of a path starting with root are allowed',
  'INTO 目标测点': 'INTO target measurements',
  '请输入目标测点名，多个用逗号分隔': 'Enter the target measurement names, separated by commas',
  '测点名为字母、数字、下划线，逗号分隔': 'Measurement names use letters, digits and underscores, separated by commas',
  'INTO 必须写成 路径(测点)，数量要与 SELECT 表达式一致。': 'INTO must be written as path(measurement), and the number of measurements must match the SELECT expressions.',
  'FROM 来源路径': 'FROM source path',
  '请输入来源路径': 'Enter the source path',
  '仅允许路径字符与 * 通配': 'Only path characters and the * wildcard are allowed',
  'GROUP BY 窗口': 'GROUP BY window',
  '请输入窗口大小': 'Enter a window size',
  '时长字面量，例如 30s、1m、1h': 'A duration literal, e.g. 30s, 1m, 1h',
  '留空则按 GROUP BY 的窗口大小执行。': 'Leave it empty to run at the GROUP BY window size.',
  '上一个窗口还没算完时怎么处理。': 'What to do when the previous window has not finished computing.',
  '服务端默认': 'Server default',
  '查询成功，当前集群没有连续查询。CQ 按 GROUP BY 的窗口周期重算一条聚合查询，并把结果写进 INTO 指定的目标路径；不填 RESAMPLE EVERY 时，执行间隔等于 GROUP BY 窗口大小。':
    'The query succeeded; this cluster has no continuous queries. A CQ recomputes one aggregate query for every GROUP BY window period and writes the result into the target path given by INTO; when RESAMPLE EVERY is left out, the every interval equals the GROUP BY window size.',
};
