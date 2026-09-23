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

/** Alert rules and lineage analysis. */
export const alert: Catalog = {
  '告警规则管理': 'Alert rule management',
  '本版本 IoTDB 没有告警规则功能': 'This IoTDB version has no alert rule feature',
  'tree 与 relational 两个 SQL 解析器的语法里都没有 ALERT 关键字：{c0}、{c1}、{c2} 都会以 {c3} 被拒，{c4} 也不存在。': 'Neither SQL parser grammar, tree or relational, has an ALERT keyword: {c0}, {c1} and {c2} are all rejected with {c3}, and {c4} does not exist either.',
  '点「刷新」可以看服务端的原始拒绝信息；上游一旦实现告警语句，这张表会按它给的列直接显示。': 'Click Refresh to see the raw rejection from the server; once upstream implements the alert statements, this table shows the columns it returns.',
  '创建规则': 'Create rule',
  '服务端拒绝了这条 SHOW ALERT RULES 语句': 'The server rejected this SHOW ALERT RULES statement',
  '确定删除该告警规则吗？': 'Delete this alert rule?',
  '服务端返回了空列表': 'The server returned an empty list',
  '告警规则创建成功': 'Alert rule created',
  '告警规则删除成功': 'Alert rule deleted',
  '创建告警规则': 'Create alert rule',
  '规则名': 'Rule name',
  '请输入规则名': 'Please enter the rule name',
  '指标路径': 'Metric path',
  '请输入指标路径': 'Please enter the metric path',
  '仅允许路径字符，例如 root.sg.d1.s1': 'Only path characters are allowed, for example root.sg.d1.s1',
  '阈值': 'Threshold',
  '请输入阈值': 'Please enter the threshold',
  '条件': 'Condition',
  '请选择条件': 'Please select a condition',
  '比较符以枚举名送进 CONDITION 属性。': 'The comparison operator is sent as its enum name in the CONDITION property.',
  '大于': 'Greater than',
  '小于': 'Less than',
  '等于': 'Equals',
  'Schema 血缘分析': 'Schema lineage analysis',
  '获取血缘失败: {msg}': 'Failed to load the lineage: {msg}',
  '无法读取 Schema 结构': 'The schema structure cannot be read',
  '层级': 'Level',
  '来源 / 属性': 'Source / attributes',
  '该数据库下没有设备或测点': 'This database has no device or timeseries',
  '查询成功，但 SHOW DEVICES 与 SHOW TIMESERIES 都没有返回行。血缘由这两个语句拼装而成，IoTDB 没有 SHOW LINEAGE 这类语句。': 'The query succeeded, but neither SHOW DEVICES nor SHOW TIMESERIES returned rows. The lineage is assembled from those two statements; IoTDB has no statement like SHOW LINEAGE.',
  '模板 {name}': 'Template {name}',
  '对齐': 'Aligned',
  '视图 {type}': 'View {type}',
};
