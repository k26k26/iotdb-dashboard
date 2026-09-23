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

/** The rule engine behind the health check: conclusions, evidence and readout labels. */
export const analysis: Catalog = {
  '集群': 'Cluster',
  '任务': 'Tasks',
  '数据质量': 'Data quality',
  '运行参数': 'Runtime variables',
  'Region 列表': 'Region list',
  '节点状态': 'Node status',
  '持续查询': 'Continuous queries',
  '数据设备清单': 'Device inventory',
  '最近值': 'Latest values',
  '分桶计数': 'Bucket counts',
  '近 24 小时': 'Last 24 hours',
  '近 7 天': 'Last 7 days',
  '近 30 天': 'Last 30 days',
  '天': 'd',
  '小时': 'h',
  '分钟': 'min',
  '秒': 's',
  '毫秒': 'ms',
  '没读到：{label}': 'Not read: {label}',
  '{n} 行，逐条见来源。': '{n} rows; each one is listed under its source.',
  '这一项是空。它不判对错：这台机器上没有常驻计算，聚合是客户端每次拉数现算的。': 'This one is empty. It is not judged right or wrong: this machine runs no resident computation, and aggregation is recomputed by the client on every pull.',
  '数据副本 {data} 份、元数据副本 {schema} 份：一块盘坏就丢数据': 'Data replica factor {data}, schema replica factor {schema}: one dead disk loses data',
  '数据副本 {data} 份、元数据副本 {schema} 份': 'Data replica factor {data}, schema replica factor {schema}',
  '共识层不会为你保留第二份拷贝，region 落盘的那一块就是唯一副本。': 'The consensus layer keeps no second copy for you: the disk a region is flushed to holds the only replica.',
  '副本数足够时，单节点掉线不会丢已确认的写入。': 'With enough replicas, a single node dropping offline loses no acknowledged write.',
  '集群化部署把 data_replication_factor / schema_replication_factor 调到 3（需要 3 个 DataNode）。单机改不了这个性质，只能定期 FLUSH 再 LOAD 到机器外面。': 'In a clustered deployment, raise data_replication_factor / schema_replication_factor to 3 (that takes 3 DataNodes). A single node cannot change this property; all you can do is FLUSH regularly and LOAD the files somewhere off the machine.',
  '磁盘告警水位是剩余比例的 {pct}%，但当前剩余量读不到': 'The disk warning watermark is {pct}% free space left, but how much is left right now cannot be read',
  '这个阈值说的是剩余空间比例，服务端在它之下会把节点标成告警并拒绝新写入。这一页拿不到"现在还剩多少"：SHOW VARIABLES 和 information_schema.configurations 返回的都是同一批 15 个键，里面没有磁盘余量。': 'This threshold is a share of the remaining space: below it the server marks the node as a warning and refuses new writes. This page cannot get "how much is left right now" — SHOW VARIABLES and information_schema.configurations both return the same 15 keys, and none of them is the disk headroom.',
  '想确认水位只能看服务端日志或监控指标，本页不替它编一个数字。': 'Confirming the real watermark means reading the server logs or the metrics; this page will not invent a number for it.',
  '一个时间分区 {span}，分区原点按 epoch（1970）对齐': 'One time partition spans {span}, with the partition origin aligned to the epoch (1970)',
  '一个时间分区 {span}，分区原点为 {origin}': 'One time partition spans {span}, with the partition origin at {origin}',
  '分区越细，单条查询要扫的 region 越多；分区越粗，删除旧数据和按时间段冷热分层的粒度越差。每台设备的保留期在 SHOW DEVICES 的 TTL(ms) 列里，见数据质量那一组。': 'The finer the partitions, the more regions a single query has to scan; the coarser they are, the coarser deleting old data and tiering by time range become. Each device retention period sits in the TTL(ms) column of SHOW DEVICES -- see the data quality group.',
  '{loose}/{total} 个库的数据副本因子仍是 1': '{loose}/{total} databases still have a data replica factor of 1',
  '{total} 个库的副本配置都大于 1': 'All {total} databases have their replica settings above 1',
  '副本因子可以按库覆盖集群默认值；这些库还没覆盖：{databases}': 'The replica factor can be overridden per database; these databases have not overridden it: {databases}',
  '{stalled}/{total} 个 region 不是 Running': '{stalled}/{total} regions are not Running',
  '{data} 个数据 region、{schema} 个元数据 region 全部 Running': 'All {data} data regions and {schema} schema regions are Running',
  '最大的是一个 region 约 {size} 字节。数据 region 的 TsFileSize 是刷新到磁盘之后才有的数字。': 'The largest one is a region of roughly {size} bytes. TsFileSize for a data region only exists once the files have been flushed to disk.',
  '所有数据 region 的 TsFileSize 都还是空：这台机器上的文件还没刷到磁盘（或未刷新过），所以体积这一项没有可比数字。': 'TsFileSize is still empty for every data region: the files on this machine have not been flushed to disk yet (or never at all), so there is no comparable size figure.',
  'Status 不是 Running 的 region 读不到写不进，先看对应 DataNode 的日志。': 'A region whose Status is not Running can be neither read from nor written to; start with the logs of the DataNode that hosts it.',
  '元数据 region 的 TsFileSize 为空、CompressionRatio 是 NaN，这是正常的，不是缺数据。': 'A schema region has an empty TsFileSize and a NaN CompressionRatio; that is normal, not missing data.',
  '{down}/{total} 个节点不是 Running': '{down}/{total} nodes are not Running',
  '{total} 个节点全部 Running，版本 {versions}': 'All {total} nodes are Running, version {versions}',
  'ConfigNode 管元数据与调度，DataNode 管数据；两者都在这里，缺一个这一组就不会出现。': 'ConfigNodes own the metadata and the scheduling, DataNodes own the data; both are listed here, and this group would not appear if either one were missing.',
  'information_schema 只在 table 模型里，这条走的是 /rest/table/v1/query。': 'information_schema only exists in the table model, so this statement goes through /rest/table/v1/query.',
  '没有持续查询（CQ）': 'No continuous queries (CQ)',
  '{n} 个持续查询在跑': '{n} continuous queries are running',
  '没有触发器': 'No triggers',
  '{n} 个触发器': '{n} triggers',
  '偏离中位数（MAD 归一）': 'Deviates from the median (MAD-normalized)',
  '连续不变（卡值）': 'Unchanged in a row (stuck value)',
  '≥{n} 点相同': '≥{n} identical points',
  '采样间隔突变': 'Sampling interval jump',
  '距上一点 {gap}，通常是 {median}': '{gap} since the previous point, the usual cadence is {median}',
  '{path} 下面没有设备': 'No devices under {path}',
  '语句执行成功、返回 0 行：这个路径没有写入过数据，或者拼错了。这不是查询失败。': 'The statement ran fine and returned 0 rows: nothing has ever been written to this path, or it is spelled wrong. This is not a failed query.',
  '先去路径浏览器确认设备名，再回来体检。': 'Confirm the device name in the path browser first, then come back for the health check.',
  '{n}/{total} 台设备设了保留期，最短 {span}': '{n}/{total} devices have a retention period set, the shortest one is {span}',
  '这些设备的 TTL(ms) 都是 {value}：数据不会自动过期': 'The TTL(ms) of these devices is {value} across the board: data never expires on its own',
  '这些设备的 TTL(ms) 都是空：数据不会自动过期': 'The TTL(ms) of these devices is empty across the board: data never expires on its own',
  '到期数据由服务端按时间分区整块删除，不需要你写删除任务。': 'Expired data is dropped by the server one whole time partition at a time; you do not have to write a deletion job.',
  'INF 是建库默认值，不算配置错误；它的意思是磁盘只增不减，而这一页读不到当前剩余空间，所以只能提示到这里。': 'INF is what a database is created with, not a misconfiguration; it means the disk only grows, and this page cannot read the space left, so the hint stops here.',
  'TTL 在 SHOW DEVICES 上才看得到：tree 模型的 SHOW DATABASES 只有 5 列，没有保留期。': 'TTL is only visible in SHOW DEVICES: SHOW DATABASES in the tree model has 5 columns and no retention period.',
  '最新的时间戳比浏览器当前时间还晚 {span}：两边时钟不一致': 'The newest timestamp is {span} later than this browser clock: the two clocks disagree',
  '最新一次写入是 {newest}前，最久的一条是 {oldest}前': 'The newest write is {newest} ago, the oldest one is {oldest} ago',
  '服务端（或写入端）的时钟走在本机前面。按这个偏差算，最新一批点落在未来，所以"多久没写"这一项在这里不可用，只报时钟差。': 'The server (or the writer) clock runs ahead of this machine. At this offset the newest points land in the future, so "how long since the last write" is unusable here and only the clock skew is reported.',
  '{n}/{total} 条序列的时间戳比最新的那条老得多，写入不均匀。': '{n}/{total} series have timestamps far older than the newest one, so the writes are uneven.',
  '所有序列的最近值时间戳彼此接近。': 'The latest-value timestamps of all series are close to one another.',
  '时间戳来自 timestamps 这一路，SELECT last * 的值/类型在 column_names 里。': 'The timestamps come from the timestamps channel; the value and the type of SELECT last * arrive in column_names.',
  '{n} 个时间分桶里 {pct}% 的计数是 0': '{pct}% of the counts across {n} time buckets are 0',
  '{n} 条序列有一半以上的分桶没有点，最空的这条是 {name}（{pct}%）。': '{n} series have no points in more than half of the buckets, and the emptiest one is {name} at {pct}%.',
  '每个分桶都有数据。': 'Every bucket has data.',
  '分桶为 0 既可能是没写，也可能是这条序列那时还不存在，从计数上区分不出来。': 'A bucket of 0 can mean nothing was written, or that this series did not exist yet at that time; the counts cannot tell the two apart.',
  '{n} 个点被判为异常（{series} 条序列样本充足）': '{n} points are judged anomalous (across {series} series with a sufficient sample)',
  '{n} 条序列没有异常点（跳变 / 卡值 / 间隔突变）': 'No anomalous points in {n} series (jump / stuck value / interval break)',
  '样本太少，这一项不下结论：最多的一条序列只有 {n} 个点': 'Too little sample to conclude anything here: the longest series has only {n} points',
  '判定用的是 MAD 归一的偏离度（阈值 3.5）、连续 {short} 点以上不变、间隔超过中位数 5 倍这三条规则。': 'The verdict uses three rules: MAD-normalized deviation (threshold 3.5), {short} or more unchanged points in a row, and a gap over 5 times the median interval.',
  '偏离统计至少需要 {min} 个点；这台机器上抽到的序列只有几个点，任何"异常"判定都是假信号，所以宁可空着。': 'Deviation statistics need at least {min} points; the series sampled on this machine have only a handful, so any "anomalous" verdict would be a false signal -- this stays blank instead.',
  '每台设备各跑一次取原始点，这里显示第一台的语句。': 'Raw points are fetched with one statement per device; the statement shown here is the one for the first device.',
};
