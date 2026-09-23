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

/**
 * Chrome words every page repeats. An area slice may redefine any of these when its context wants a
 * different English word — the area slices merge after this one.
 */
export const common: Catalog = {
  '操作': 'Actions',
  '状态': 'Status',
  '类型': 'Type',
  '名称': 'Name',
  '路径': 'Path',
  '节点': 'Node',
  '集群': 'Cluster',
  '服务': 'Service',
  '任务': 'Task',
  '数据库': 'Database',
  '表': 'Table',
  '版本': 'Version',
  '端口': 'Port',
  '密码': 'Password',
  '角色': 'Role',
  '刷新': 'Refresh',
  '创建': 'Create',
  '删除': 'Delete',
  '取消': 'Cancel',
  '关闭': 'Close',
  '导入': 'Import',
  '导出': 'Export',
  '是': 'Yes',
  '否': 'No',
  '请求失败': 'Request failed',
};
