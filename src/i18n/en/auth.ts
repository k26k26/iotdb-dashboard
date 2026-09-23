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

/** Users, roles, privileges and tenants. */
export const auth: Catalog = {
  '用户管理': 'User Management',
  '用户 ID': 'User ID',
  '用户名': 'Username',
  '创建用户': 'Create user',
  '用户创建成功': 'User created',
  '用户删除成功': 'User deleted',
  '确定删除该用户吗？': 'Delete this user?',
  '请输入用户名': 'Enter a username',
  '请输入密码': 'Enter a password',
  '请选择角色': 'Select a role',
  '仅限字母、数字和下划线，且不能以数字开头': 'Letters, digits and underscores only, and it cannot start with a digit',
  '集群还没有角色，可先执行 CREATE ROLE 再回来授权。': 'The cluster has no role yet. Run CREATE ROLE first, then come back to grant one.',
  '获取用户列表失败: {msg}': 'Failed to load users: {msg}',
  '创建失败: {msg}': 'Create failed: {msg}',
  '删除失败: {msg}': 'Delete failed: {msg}',
  'IoTDB 没有 CREATE TENANT 这条语句': 'IoTDB has no CREATE TENANT statement',
  '两种解析器里都没有 TENANT 词法单元，所以租户要用现成的三样东西拼出来：一级数据库是路径边界（本页创建、删除），用户和角色是访问隔离（见「用户管理」），空间配额是资源上限（本页下方）。创建租户执行 CREATE DATABASE root.<名称>，删除租户执行 DELETE DATABASE，会连带删掉该路径下的全部数据。':
    'Neither parser has a TENANT token, so a tenant has to be assembled from three things that already exist: a first-level database as the path boundary (created and deleted on this page), users and roles as the access isolation (see "User Management"), and a space quota as the resource limit (further down this page). Creating a tenant runs CREATE DATABASE root.<name>, deleting one runs DELETE DATABASE, which also removes all data under that path.',
  '服务端对配额语句的答复': 'The server reply to the quota statement',
  '租户边界（一级数据库）': 'Tenant boundary (first-level database)',
  '创建租户': 'Create tenant',
  '删除租户': 'Delete tenant',
  '租户路径': 'Tenant path',
  'Schema 副本因子': 'Schema replication factor',
  'Data 副本因子': 'Data replication factor',
  '时间分区(ms)': 'Time partition (ms)',
  '确定删除 {database} 吗？': 'Delete {database}?',
  '该路径下的所有数据和时间序列都会一起删除，不可恢复。': 'All data and timeseries under this path are deleted along with it, and this cannot be undone.',
  '集群里还没有一级数据库': 'The cluster has no first-level database yet',
  'SHOW DATABASES 返回了空列表。点「创建租户」会执行 CREATE DATABASE root.<名称>。':
    'SHOW DATABASES returned an empty list. Clicking "Create tenant" runs CREATE DATABASE root.<name>.',
  'SHOW DATABASES 被服务端拒绝': 'SHOW DATABASES was rejected by the server',
  '空间配额（SET SPACE QUOTA）': 'Space quota (SET SPACE QUOTA)',
  '设置配额': 'Set quota',
  '设置空间配额': 'Set space quota',
  '本集群当前读不到配额': 'This cluster cannot read quotas right now',
  '还没有给任何数据库设置配额': 'No database has a quota set yet',
  'SHOW SPACE QUOTA 查询成功但列表为空，说明 quota_enable 已开启，只是还没有人写过上限。点「设置配额」提交 devices / timeseries / disk。':
    'The SHOW SPACE QUOTA query succeeded but the list is empty, so quota_enable is enabled and nobody has written a limit yet. Click "Set quota" to submit devices / timeseries / disk.',
  '租户名': 'Tenant name',
  '请输入租户名': 'Enter a tenant name',
  '会创建一级数据库 root.<租户名>；配额三项都可留空':
    'This creates the first-level database root.<tenant name>; all three quota fields can be left empty',
  '租户名 {name} 不是合法标识符，语句没有发出': 'Tenant name {name} is not a valid identifier, so the statement was not sent',
  '租户 {path} 已创建并设置配额': 'Tenant {path} created with its quota set',
  '租户 {path} 已创建（未设置配额）': 'Tenant {path} created (no quota set)',
  '{path} 已创建，但配额未写入：{detail}': '{path} was created, but the quota was not written: {detail}',
  '{path} 已创建，但配额未设置：{detail}': '{path} was created, but the quota was not set: {detail}',
  '目标数据库': 'Target database',
  '请选择数据库': 'Select a database',
  '选择一个一级数据库': 'Select a first-level database',
  '提交': 'Submit',
  '设备数上限': 'Device count limit',
  '时间序列数上限': 'Timeseries count limit',
  '磁盘配额': 'Disk quota',
  '留空表示不改这一项': 'Leaving this empty leaves this item unchanged',
  '单位只认单个字母 M/G/T/P，或 unlimited': 'The unit is only a single letter M/G/T/P, or unlimited',
  '写成 100G 或 unlimited': 'Write it as 100G or unlimited',
  '没有要写入的配额项': 'There are no quota items to write',
  '已为 {database} 设置配额': 'Quota set for {database}',
  '设置配额失败: {msg}': 'Failed to set the quota: {msg}',
  '已删除 {database}': 'Deleted {database}',
  '{detail}（本集群 quota_enable=false：在 iotdb-system.properties 里把它设为 true 并重启节点，配额语句才会执行）':
    '{detail} (this cluster ships quota_enable=false: set it to true in iotdb-system.properties and restart the node before quota statements will execute)',
};
