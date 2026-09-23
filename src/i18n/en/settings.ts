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

/** Settings page, system information and configuration management. */
export const settings: Catalog = {
  '设置已保存': 'Settings saved',
  '可用': 'Available',
  '不可用': 'Unavailable',
  '尚未测试': 'Not tested yet',
  '已连接（由页面内的请求确认）': 'Connected (confirmed by requests made from this page)',
  '当前生效的地址': 'Active address',
  '测试当前连接': 'Test current connection',
  '已连接 {host}:{port}，/ping 在 {ms}ms 内应答': 'Connected to {host}:{port}; /ping answered within {ms}ms',
  '探测会带上你填写的凭据；/ping 是否校验它们由服务端决定，所以这里确认的是这个地址可达。': 'The probe sends the credentials you entered. Whether /ping checks them is up to the server, so this only confirms that the address is reachable.',
  '已把 {host}:{port} 填进连接配置': 'Filled {host}:{port} into the connection settings',
  '通用设置': 'General',
  '主题': 'Theme',
  '浅色': 'Light',
  '深色': 'Dark',
  '语言': 'Language',
  '中文': 'Chinese',
  '最大行数': 'Maximum rows',
  '自动刷新': 'Auto refresh',
  '刷新间隔 (ms)': 'Refresh interval (ms)',
  '保存设置': 'Save settings',
  '版本与系统信息': 'Version and system info',
  'IoTDB 版本': 'IoTDB version',
  '当前用户': 'Current user',
  '数据库数量': 'Database count',
  '数据库列表': 'Database list',
  '获取系统信息失败': 'Failed to get system info',
  '系统配置': 'System configuration',
  '获取配置失败: {detail}': 'Failed to get configuration: {detail}',
  '无法读取集群参数': 'Cannot read cluster parameters',
  '参数名': 'Parameter',
  '参数值': 'Parameter value',
  '集群没有返回任何参数': 'The cluster returned no parameters',
  '查询成功，但 information_schema.configurations 是空表。': 'The query succeeded, but information_schema.configurations is an empty table.',
};
