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

/** Backup and restore, audit logs and high availability. */
export const backup: Catalog = {
  '{n} 天': '{n} days',
  '{n} 小时': '{n} hours',
  '{n} 分钟': '{n} minutes',
  '{n} 秒': '{n} seconds',
  '{n} 毫秒': '{n} milliseconds',
  '{db} 已刷盘，之后的目录拷贝才会包含内存里的数据': '{db} flushed; the directory copy after this also holds the in-memory data',
  '刷盘失败: {msg}': 'Flush failed: {msg}',
  '{path} 导入完成': '{path} imported',
  'Schema 副本': 'Schema replicas',
  '数据副本': 'Data replicas',
  '备份判断': 'Backup verdict',
  '单份拷贝：承载节点的文件坏了就没有第二份，必须往集群外备份': 'One copy: a broken file on the hosting node leaves no second one, so it has to be backed up outside the cluster',
  '{n} 份副本：可容忍节点整体丢失，跨机备份仍然要做': '{n} replicas: losing a whole node is tolerated, cross-machine backup is still required',
  '刷出 {db} 的内存数据？': 'Flush the in-memory data of {db}?',
  '拷贝目录前的第一步：没刷盘的数据还只在 memtable 里。': 'The first step before copying the directory: data that was not flushed is still only in the memtable.',
  '刷盘': 'Flush',
  'IoTDB 2.0.11 没有备份/恢复语句，也没有备份任务可列': 'IoTDB 2.0.11 has no backup/restore statement and no backup tasks to list',
  '把 {c0} 发给 {c1}，服务端回 {c2}：它列出的顶层关键字里有 LOAD / UNLOAD / FLUSH，唯独没有 BACKUP 和 RESTORE，{c3} 与 {c4} 也都是 {c5}。原来那张表里的 taskId、状态、起止时间，没有任何语句写得进去。': 'Send {c0} to {c1} and the server answers {c2}: the top-level keywords it lists include LOAD / UNLOAD / FLUSH but neither BACKUP nor RESTORE, and both {c3} and {c4} come back as {c5}. No statement can write the taskId, status or start/end time that table used to show.',
  '真实的文件级备份分三步：先 {c6} 落盘（下表每行都有按钮），再到 DataNode 主机上拷 {c7} 目录；恢复时把目录放回去，或者只用 {c8} 把单个 TsFile 导回来（右上角按钮）。导出那一半走不了 SQL：{c9} 在语法文件里确实有规则，但 {c10} 里没有 {c11}，REST 层直接回 {c12}。要把数据持续复制到另一套集群，用「数据同步」页的 Pipe。': 'A real file-level backup has three steps: run {c6} so everything reaches disk (every row below has that button), then copy the {c7} directory on the DataNode host. To restore, put the directory back, or use {c8} to load a single TsFile (the button at the top right). The export half has no SQL route: {c9} does have a rule in the grammar file, but {c10} has no {c11}, and the REST layer answers {c12}. To keep copying data into another cluster, use a pipe on the Pipes page.',
  '备份对象': 'Backup targets',
  '导入 TsFile（LOAD）': 'Import TsFile (LOAD)',
  '读取备份对象失败': 'Failed to read the backup targets',
  '这个集群里还没有数据库（SHOW DATABASES 返回 0 行）': 'This cluster has no database yet (SHOW DATABASES returned 0 rows)',
  'TsFile 在 IoTDB 主机上的路径': 'Path of the TsFile on the IoTDB host',
  '这是服务端那台机器上的路径，不是你浏览器这台机器的——文件得先在 DataNode 主机上；只写文件名时它按服务端工作目录补齐（本节点是 /opt/soft/apache-iotdb-2.0.11-all-bin/sbin/）。': 'This is a path on the server machine, not on the one your browser runs on — the file has to sit on the DataNode host first; name only the file and the server completes it against its own working directory (this node: /opt/soft/apache-iotdb-2.0.11-all-bin/sbin/).',
  '请输入 TsFile 路径': 'Enter the TsFile path',
  '不能含空格、单引号、双引号或反斜杠：带反斜杠的请求服务端直接回 HTTP 500，所以 D:\\file 这种写法要先换成服务器上的真实路径': 'No spaces, single quotes, double quotes or backslashes: a request carrying backslashes gets a bare HTTP 500 from the server, so a form like D:\\file has to be rewritten to the real path on the server first',
  '获取审计日志失败: {msg}': 'Failed to get audit logs: {msg}',
  '过滤已取回的结果': 'Filter the results already fetched',
  '审计状态探测失败': 'The audit status probe failed',
  '服务端还没有 {ns} 这个库': 'The server has no {ns} database yet',
  '当前过滤条件下没有匹配行（共 {n} 行）': 'No row matches the current filter ({n} rows in total)',
  '审计命名空间存在，但 {n} 条以内没有记录': 'The audit namespace exists, but its latest {n} rows hold no record',
  'SHOW DEVICES {ns}.** 查询成功、返回 0 行。本版本没有审计类语句（AUDIT 在两种解析器里都只是普通关键字），enable_audit_log 默认关闭；而且即使打开，2.0.11 的 DNAuditLogger.log()/logFromCN() 与 CNAuditLogger.log() 都是空方法体，服务端不会写入任何审计行。要在这一页读到真实审计，得等服务端把那三个方法实现出来。': 'SHOW DEVICES {ns}.** succeeded and returned 0 rows. This version has no audit statement (AUDIT is only an ordinary keyword in both parsers) and enable_audit_log defaults to off; moreover, even with it on, DNAuditLogger.log()/logFromCN() and CNAuditLogger.log() in 2.0.11 are empty method bodies, so the server writes no audit row at all. Reading real audit data on this page waits for the server to implement those three methods.',
  'SELECT * FROM {ns}.** ORDER BY time DESC 查询成功但没有行；过滤只作用在已经取回的结果上，不会再拼进语句里发给服务端。': 'SELECT * FROM {ns}.** ORDER BY time DESC succeeded but returned no rows; the filter only applies to the results already fetched and is never assembled back into a statement for the server.',
  '{n} 个 region 非 Running': '{n} regions not Running',
  '单点：承载节点宕机即中断': 'Single point: it goes down with the hosting node',
  '副本不足：需要 {n} 个节点，只有 {m} 个': 'Not enough replicas: {n} nodes needed, only {m} hold them',
  '有冗余': 'Redundant',
  '部分数据加载失败: {msg}': 'Some data failed to load: {msg}',
  '部分集群状态读不到': 'Part of the cluster state could not be read',
  '运行中节点': 'Running nodes',
  'Schema 共识': 'Schema consensus',
  'Data 共识': 'Data consensus',
  '单点数据库': 'Single-point databases',
  '冗余与故障转移': 'Redundancy and failover',
  '承载节点': 'Hosting nodes',
  '结论': 'Verdict',
  '集群里还没有数据库': 'No databases in the cluster yet',
  'SHOW DATABASES 返回了空列表，没有可评估冗余的对象。': 'SHOW DATABASES returned an empty list, so there is nothing whose redundancy can be assessed.',
  '集群节点（SHOW CLUSTER）': 'Cluster nodes (SHOW CLUSTER)',
  '内部地址': 'Internal address',
  '构建': 'Build',
  'SHOW CLUSTER 没有返回节点': 'SHOW CLUSTER returned no nodes',
  '查询成功但列表为空。这一句没有 uptime / 心跳列，节点存活只能看 Status。': 'The query succeeded but the list is empty. This statement has no uptime or heartbeat column, so node liveness can only be read from Status.',
};
