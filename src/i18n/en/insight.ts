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

/** AI analysis and performance tuning pages: their own chrome, tables and buttons. */
export const insight: Catalog = {
  // AI analysis page
  '这条语句这次没有返回行。': 'This statement returned no rows this time.',
  '可以怎么做：': 'What you can do: ',
  '来源：{sql}': 'Source: {sql}',
  '严重': 'Critical',
  '注意': 'Warning',
  '提示': 'Info',
  '通过': 'Pass',
  '{label} 没有取到数值点': 'No numeric points came back for {label}',
  '这台机器上这条设备序列为空，或者值不是数值（TEXT/BOOLEAN 不参与统计）。': 'This device has an empty series on this machine, or the values are not numeric (TEXT/BOOLEAN do not enter the statistics).',
  '曲线只画这一台设备；结论覆盖的是 {path} 整个路径': 'The curve draws this one device only; the findings cover the whole {path} path',
  '路径只能是点号分隔的名字：不能带引号、反斜杠、空格或通配符（通配符本页自己加）。': 'A path can only be dot-separated names: no quotes, backslashes, spaces or wildcards (this page adds the wildcards itself).',
  '路径格式不对，没有发语句': 'Bad path format; no statement was sent',
  '这一页不调用任何模型：每条结论都是服务端真实返回算出来的': 'This page calls no model: every finding is computed from what the server actually returned',
  '这是个纯静态前端：没有服务端中转，也没有密钥，所以"智能"这一半只能是本地规则加鲁棒统计 （中位数 / MAD / 间隔漂移），而不是某个大模型的看法。每条结论都能展开看到它依据的语句和原始行， 你可以把语句原样粘到查询页复现。读不到的语句会作为「没读到」列出来，不会渲染成"暂无数据"。 样本太少时检测器会明说"这一项不下结论"——它不会为了看起来有内容而报异常。': 'This is a purely static front end: no server relay and no secrets, so the "smart" half can only be local rules plus robust statistics (median / MAD / interval drift), not the opinion of some large model. Every finding expands to show the statement it is based on and the raw rows, and you can paste that statement into the query page to reproduce it. Statements that could not be read are listed as "not read" and never render as "No data". When the sample is too small the detector says out loud that it draws no conclusion on that item -- it will not report anomalies just to look full of content.',
  '体检范围': 'Health-check scope',
  '时间窗': 'Time window',
  '体检设备数': 'Devices to check',
  '每台点数上限': 'Points per device',
  '开始体检': 'Start health check',
  '路径没有发出去': 'Nothing was sent',
  '一次体检发十来条语句（集群 6 条 + 设备清单/最近值/分桶 3 条 + 每台设备 1 条）。': 'One health check sends a dozen or so statements (6 for the cluster + 3 for device inventory / latest values / buckets + 1 per device).',
  '结论是点出来的，不是常驻刷新的。': 'Findings are computed on demand, not refreshed continuously.',
  '结论是点出来的，不是常驻刷新的：最近一次 {time}。': 'Findings are computed on demand, not refreshed continuously: last run {time}.',
  '采集耗时': 'Collection time',
  '还没跑过体检': 'No health check has been run yet',
  '填好路径点「开始体检」。这一页不会自己替你判断该看哪台设备——范围得由你定。': 'Fill in the path and press Start health check. This page will not decide for you which device to look at -- the scope is yours to set.',
  '抽到的原始点（只画第一台设备）': 'Sampled raw points (first device only)',
  '序列': 'Series',
  '点数': 'Points',
  '最小值': 'Min',
  '最大值': 'Max',
  '中位数': 'Median',
  '中位间隔': 'Median gap',
  '最后一点': 'Last point',
  // Performance tuning page
  '读一致性': 'Read consistency',
  'strong 时每次读都过一遍共识确认，弱一致性可以直接读本地': 'With strong, every read is confirmed through a consensus round; weaker consistency can read straight from the local node',
  '数据副本因子': 'Data replication factor',
  '写入需要落几个数据副本；1 最快，但也意味着没有第二份': 'How many data copies a write must land; 1 is fastest but means there is no second copy',
  '库/设备/时间序列这些元数据的副本数': 'The replica count for metadata: databases, devices and timeseries',
  '数据共识协议': 'Data consensus protocol',
  '决定写路径的复制方式，换协议会直接改变读写开销': 'Decides how the write path replicates; changing the protocol directly changes read and write cost',
  '一个时间分区的跨度，决定 region 数量和查询要扫多少个分区': 'The span of one time partition; it decides the number of regions and how many partitions a query has to scan',
  '{n} 分钟（{ms} ms）': '{n} min ({ms} ms)',
  'Series Slot 数': 'Series slots',
  '时间线到 region 的分片基数，决定写入和查询的并行上限': 'The sharding base from timelines to regions; it caps the parallelism of writes and queries',
  '磁盘水位阈值': 'Disk watermark',
  '剩余空间低于这个比例时服务端把它标记为告警水位': 'Below this share of free space the server marks the node at warning level',
  '时间戳精度': 'Timestamp precision',
  '本页所有毫秒数字都按它解释': 'Every millisecond figure on this page is interpreted through it',
  '部分数据没取到：{detail}': 'Some data was not fetched: {detail}',
  '耗时': 'Elapsed',
  '排队时间': 'Time in queue',
  '客户端': 'Client',
  '这一页列不出「慢查询」：服务端只把它写进日志': 'This page cannot list "slow queries": the server only writes them into a log',
  '{c0} 和 {c1} 都不是语句——前者在 tree 模型上回 {c2}，在 table 模型上回 {c3}。真实的慢查询机制是 {c4}：执行时间超过 {c5}（源码默认 10000 毫秒）就把它写进 DataNode 的 {c6}，没有任何 SQL 视图能读回这个文件，而这个阈值也不在 {c7} 返回的那 15 项里，页面连它现在是多少都问不到。 右边这两张表因此不叫「慢查询列表」：一张是**此刻正在执行**的查询，一张是服务端的耗时直方图。': '{c0} and {c1} are not statements at all: on the tree model the first answers {c2}, on the table model {c3}. The real slow-query mechanism is {c4}: once execution exceeds {c5} (source default 10000 ms) the statement is written into the DataNode file {c6}; no SQL view can read that file back, and this threshold is not among the 15 items {c7} returns either, so the page cannot even ask what its current value is. That is why the two tables on the right are not called a "slow query list": one is the queries **executing right now**, the other the server-side latency histogram.',
  '正在执行的查询': 'Running queries',
  '其中最久': 'Slowest of them',
  '耗时直方图非零桶': 'Nonzero histogram buckets',
  '部分面板这次没取到': 'Some panels did not load this time',
  '正在执行的查询（SHOW QUERIES）': 'Running queries (SHOW QUERIES)',
  '没有查询在跑，或者只有这次抓取自己（REST 是同步执行，一条语句跑完就消失了）': 'No queries are running, or only this very fetch (REST runs statements synchronously; a statement is gone once it finishes)',
  '耗时分布（information_schema.queries_costs_histogram）': 'Latency distribution (information_schema.queries_costs_histogram)',
  '读不到直方图': 'Histogram unreadable',
  '这个表在部分版本上没有；上面列出了具体原因。': 'This table is missing in some versions; the exact reason is listed above.',
  '{n} 个桶全部为 0：这不能当作「没有慢查询」': 'All {n} buckets are 0: that cannot be taken as "no slow queries"',
  '服务端只在指标模块开启时才往这些桶里计数，本机没在采集，所以「全 0」既可能是没慢查询、也可能是压根没统计，从这一页区分不出来。要确认，去看 DataNode 的 logs/log_datanode_slow_sql.log。': 'The server only counts into these buckets when the metrics module is on, and this machine is not collecting, so "all zeros" may mean no slow queries or no counting at all, and this page cannot tell the two apart. To confirm, read the DataNode logs/log_datanode_slow_sql.log.',
  '耗时分桶（秒）': 'Latency bucket (s)',
  '条数': 'Count',
  '读得到的配置项': 'Readable configuration',
  '配置': 'Config',
  '当前值': 'Current value',
  '它影响什么': 'What it controls',
  '对应参数': 'Property',
  'SHOW VARIABLES 没有返回，这一栏暂时是空的': 'SHOW VARIABLES returned nothing; this section is empty for now',
  '这一栏不是自动诊断结论：它只列 {c0} 真回答出来的键，以及这些键管什么。 改哪个值、改成多少，得按业务写入量和硬件定，本页不替你猜。': 'This section is not an auto-diagnosis: it only lists the keys {c0} really answers, and what those keys control. Which value to change, and to what, depends on your write volume and hardware; this page will not guess for you.',
};
