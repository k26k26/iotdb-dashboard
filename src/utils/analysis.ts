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

import { formatTimestamp } from './formatter';
import { t, tx } from '../i18n';
import type { Text } from '../i18n';

/**
 * One statement, answered or not. A rejected statement stays a Readout with `ok: false` because "we could
 * not read this" is itself a conclusion -- it must never render as an empty "暂无数据" panel. // i18n-ignore
 */
export interface Readout {
  label: Text;
  sql: string;
  ok: boolean;
  error?: string;
  /** Rows keyed by the server's own column titles, plus `__time` when the answer carried a time axis. */
  rows: Record<string, unknown>[];
}

export type FindingLevel = 'critical' | 'warn' | 'info' | 'pass';

export type FindingGroup = '集群' | '任务' | '数据质量'; // i18n-ignore

export interface Evidence {
  sql: string;
  rows: Record<string, unknown>[];
  /** What this evidence cannot prove -- the part that stops a rule from over-claiming. */
  note?: Text;
}

export interface Finding {
  key: string;
  level: FindingLevel;
  group: FindingGroup;
  title: Text;
  detail: Text;
  advice?: Text;
  evidence: Evidence;
}

export interface ClusterReads {
  variables: Readout;
  databases: Readout;
  regions: Readout;
  nodes: Readout;
  cqs: Readout;
  triggers: Readout;
}

export interface QualityReads {
  path: string;
  devices: Readout;
  last: Readout;
  buckets: Readout;
  points: Readout[];
}

const num = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value: number, digits = 3): number => Number(value.toFixed(digits));

const UNITS: [number, Text][] = [
  [86400000, tx('天')],
  [3600000, tx('小时')],
  [60000, tx('分钟')],
  [1000, tx('秒')],
];

/** A duration a person can read; the page shows millisecond counts nowhere. */
export const humanSpan = (ms: number): string => {
  if (!Number.isFinite(ms) || ms < 0) return '-';
  for (const [size, label] of UNITS) {
    if (ms >= size) return `${Math.round(ms / size)} ${t(label)}`;
  }
  return `${Math.round(ms)} ${t('毫秒')}`;
};

const failedFindings = (reads: Readout[], group: FindingGroup): Finding[] =>
  reads
    .filter((read) => !read.ok)
    .map((read) => ({
      key: `failed-${read.label.key}`,
      level: 'warn' as FindingLevel,
      group,
      title: tx('没读到：{label}', { label: read.label.key }),
      detail: read.error ? tx(read.error) : tx('请求失败'),
      evidence: { sql: read.sql, rows: [] },
    }));

const lookup = (read: Readout, keyCol: string, valueCol: string): Record<string, string> =>
  Object.fromEntries(read.rows.map((row) => [String(row[keyCol]), String(row[valueCol])]));

const fewRows = (rows: Record<string, unknown>[], limit = 8) => rows.slice(0, limit);

/**
 * Every rule here reads something the server actually answered on this build (2.0.11) and quotes the
 * statement next to its conclusion. Nothing is inferred from a default config file, and a value we cannot
 * read is reported as unreadable rather than guessed.
 */
export function clusterFindings(reads: ClusterReads): Finding[] {
  const out = failedFindings(Object.values(reads), '集群'); // i18n-ignore
  const vars = lookup(reads.variables, 'Variable', 'Value');

  const dataRf = num(vars.DataReplicationFactor);
  const schemaRf = num(vars.SchemaReplicationFactor);
  if (dataRf !== null && schemaRf !== null) {
    const single = dataRf <= 1 || schemaRf <= 1;
    out.push({
      key: 'replication',
      level: single ? 'critical' : 'pass',
      group: '集群', // i18n-ignore
      title: single
        ? tx('数据副本 {data} 份、元数据副本 {schema} 份：一块盘坏就丢数据', { data: dataRf, schema: schemaRf })
        : tx('数据副本 {data} 份、元数据副本 {schema} 份', { data: dataRf, schema: schemaRf }),
      detail: single
        ? tx('共识层不会为你保留第二份拷贝，region 落盘的那一块就是唯一副本。')
        : tx('副本数足够时，单节点掉线不会丢已确认的写入。'),
      advice: single
        ? tx('集群化部署把 data_replication_factor / schema_replication_factor 调到 3（需要 3 个 DataNode）。单机改不了这个性质，只能定期 FLUSH 再 LOAD 到机器外面。')
        : undefined,
      evidence: {
        sql: 'SHOW VARIABLES',
        rows: reads.variables.rows.filter((row) => /ReplicationFactor/.test(String(row.Variable))),
      },
    });
  }

  const diskWarn = num(vars.DiskSpaceWarningThreshold);
  if (diskWarn !== null) {
    out.push({
      key: 'disk-threshold',
      level: 'info',
      group: '集群', // i18n-ignore
      title: tx('磁盘告警水位是剩余比例的 {pct}%，但当前剩余量读不到', { pct: (diskWarn * 100).toFixed(0) }),
      detail: tx('这个阈值说的是剩余空间比例，服务端在它之下会把节点标成告警并拒绝新写入。这一页拿不到"现在还剩多少"：SHOW VARIABLES 和 information_schema.configurations 返回的都是同一批 15 个键，里面没有磁盘余量。'),
      evidence: {
        sql: 'SHOW VARIABLES',
        rows: reads.variables.rows.filter((row) => /DiskSpace|Disk/.test(String(row.Variable))),
        note: tx('想确认水位只能看服务端日志或监控指标，本页不替它编一个数字。'),
      },
    });
  }

  const partition = num(vars.TimePartitionInterval);
  const origin = num(vars.TimePartitionOrigin);
  if (partition !== null) {
    out.push({
      key: 'time-partition',
      level: 'info',
      group: '集群', // i18n-ignore
      title: origin === 0
        ? tx('一个时间分区 {span}，分区原点按 epoch（1970）对齐', { span: humanSpan(partition) })
        : tx('一个时间分区 {span}，分区原点为 {origin}', { span: humanSpan(partition), origin: String(origin) }),
      detail: tx('分区越细，单条查询要扫的 region 越多；分区越粗，删除旧数据和按时间段冷热分层的粒度越差。每台设备的保留期在 SHOW DEVICES 的 TTL(ms) 列里，见数据质量那一组。'),
      evidence: {
        sql: 'SHOW VARIABLES',
        rows: reads.variables.rows.filter((row) => /^TimePartition/.test(String(row.Variable))),
      },
    });
  }

  const perDatabase = reads.databases.rows.filter((row) => String(row.Database) !== 'information_schema');
  if (perDatabase.length) {
    const loose = perDatabase.filter((row) => (num(row.DataReplicationFactor) ?? 9) <= 1);
    out.push({
      key: 'database-rf',
      level: loose.length ? 'warn' : 'pass',
      group: '集群', // i18n-ignore
      title: loose.length
        ? tx('{loose}/{total} 个库的数据副本因子仍是 1', { loose: loose.length, total: perDatabase.length })
        : tx('{total} 个库的副本配置都大于 1', { total: perDatabase.length }),
      detail: tx('副本因子可以按库覆盖集群默认值；这些库还没覆盖：{databases}', {
        databases: loose.map((row) => row.Database).join(', ') || '-',
      }),
      evidence: { sql: 'SHOW DATABASES', rows: fewRows(perDatabase) },
    });
  }

  const regions = reads.regions.rows;
  if (regions.length) {
    const stalled = regions.filter((row) => String(row.Status) !== 'Running');
    const dataRegions = regions.filter((row) => String(row.Type) === 'DataRegion');
    const sized = dataRegions
      .map((row) => ({ row, size: num(row.TsFileSize) }))
      .filter((item): item is { row: Record<string, unknown>; size: number } => item.size !== null && item.size > 0);
    out.push({
      key: 'regions',
      level: stalled.length ? 'critical' : 'pass',
      group: '集群', // i18n-ignore
      title: stalled.length
        ? tx('{stalled}/{total} 个 region 不是 Running', { stalled: stalled.length, total: regions.length })
        : tx('{data} 个数据 region、{schema} 个元数据 region 全部 Running', {
            data: dataRegions.length,
            schema: regions.length - dataRegions.length,
          }),
      detail: sized.length
        ? tx('最大的是一个 region 约 {size} 字节。数据 region 的 TsFileSize 是刷新到磁盘之后才有的数字。', {
            size: Math.max(...sized.map((item) => item.size)).toLocaleString(),
          })
        : tx('所有数据 region 的 TsFileSize 都还是空：这台机器上的文件还没刷到磁盘（或未刷新过），所以体积这一项没有可比数字。'),
      advice: stalled.length
        ? tx('Status 不是 Running 的 region 读不到写不进，先看对应 DataNode 的日志。')
        : undefined,
      evidence: {
        sql: 'SHOW REGIONS',
        rows: fewRows(stalled.length ? stalled : regions, 6),
        note: tx('元数据 region 的 TsFileSize 为空、CompressionRatio 是 NaN，这是正常的，不是缺数据。'),
      },
    });
  }

  const nodes = reads.nodes.rows;
  if (nodes.length) {
    const down = nodes.filter((row) => String(row.status) !== 'Running');
    const versions = [...new Set(nodes.map((row) => String(row.version)))];
    out.push({
      key: 'nodes',
      level: down.length ? 'critical' : versions.length > 1 ? 'warn' : 'pass',
      group: '集群', // i18n-ignore
      title: down.length
        ? tx('{down}/{total} 个节点不是 Running', { down: down.length, total: nodes.length })
        : tx('{total} 个节点全部 Running，版本 {versions}', { total: nodes.length, versions: versions.join(' / ') }),
      detail: tx('ConfigNode 管元数据与调度，DataNode 管数据；两者都在这里，缺一个这一组就不会出现。'),
      evidence: {
        sql: 'SELECT node_id, node_type, status, version FROM information_schema.nodes',
        rows: fewRows(nodes, 6),
        note: tx('information_schema 只在 table 模型里，这条走的是 /rest/table/v1/query。'),
      },
    });
  }

  return out;
}

export function scheduleFindings(reads: Pick<ClusterReads, 'cqs' | 'triggers'>): Finding[] {
  const out = failedFindings(Object.values(reads), '任务'); // i18n-ignore
  const describe = (read: Readout, empty: Text, present: Text, group: FindingGroup, key: string) =>
    ({
      key,
      level: read.rows.length ? 'pass' : 'info',
      group,
      title: read.rows.length ? present : empty,
      detail: read.rows.length
        ? tx('{n} 行，逐条见来源。', { n: read.rows.length })
        : tx('这一项是空。它不判对错：这台机器上没有常驻计算，聚合是客户端每次拉数现算的。'),
      evidence: { sql: read.sql, rows: fewRows(read.rows, 6) },
    }) as Finding;

  out.push(
    describe(reads.cqs, tx('没有持续查询（CQ）'), tx('{n} 个持续查询在跑', { n: reads.cqs.rows.length }), '任务', 'cq'), // i18n-ignore
    describe(reads.triggers, tx('没有触发器'), tx('{n} 个触发器', { n: reads.triggers.rows.length }), '任务', 'trigger') // i18n-ignore
  );
  return out;
}

export interface TimePoint {
  timestamp: number;
  value: number;
}

export interface SeriesProfile {
  name: string;
  points: number;
  firstTs: number | null;
  lastTs: number | null;
  mean: number | null;
  median: number | null;
  mad: number | null;
  std: number | null;
  min: number | null;
  max: number | null;
  medianGapMs: number | null;
}

export interface Anomaly {
  name: string;
  timestamp: number;
  value: number;
  rule: Text;
  score: Text;
}

export interface SeriesAnalysis {
  name: string;
  points: TimePoint[];
  profile: SeriesProfile;
  anomalies: Anomaly[];
  /** Below this many points a deviation statistic is meaningless, so the rules stay silent. */
  sampleShort: boolean;
}

export const MIN_SAMPLE = 8;

const sorted = (values: number[]) => [...values].sort((a, b) => a - b);

const quantile = (values: number[], q: number): number | null => {
  if (!values.length) return null;
  const at = (values.length - 1) * q;
  const low = Math.floor(at);
  const high = Math.ceil(at);
  return values[low] + (values[high] - values[low]) * (at - low);
};

const readTime = (row: Record<string, unknown>) => num(row.__time);

/** A measurement column as (time, numeric value) pairs; TEXT/BOOLEAN/NULL points drop out here. */
export const seriesFromRowset = (rows: Record<string, unknown>[]): { name: string; points: TimePoint[] }[] => {
  if (!rows.length) return [];
  return Object.keys(rows[0])
    .filter((key) => key !== '__time' && key !== 'key')
    .map((name) => ({
      name,
      points: rows.reduce<TimePoint[]>((acc, row) => {
        const timestamp = readTime(row);
        const value = num(row[name]);
        if (timestamp !== null && value !== null) acc.push({ timestamp, value });
        return acc;
      }, []),
    }));
};

export const profileSeries = (name: string, points: TimePoint[]): SeriesProfile => {
  const values = points.map((point) => point.value);
  const times = points.map((point) => point.timestamp);
  const mean = values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null;
  const sortedValues = sorted(values);
  const median = quantile(sortedValues, 0.5);
  const std =
    values.length > 1 && mean !== null
      ? round(Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1)))
      : null;
  const deviations = median === null ? [] : sorted(values.map((v) => Math.abs(v - median)));
  const mad = quantile(deviations, 0.5);
  const gaps = times.slice(1).map((t, i) => t - times[i]).filter((span) => span > 0);
  return {
    name,
    points: points.length,
    firstTs: times.length ? Math.min(...times) : null,
    lastTs: times.length ? Math.max(...times) : null,
    mean,
    median: median === null ? null : round(median),
    mad: mad === null ? null : round(mad),
    std,
    min: sortedValues.length ? sortedValues[0] : null,
    max: sortedValues.length ? sortedValues[sortedValues.length - 1] : null,
    medianGapMs: quantile(sorted(gaps), 0.5),
  };
};

/**
 * Robust statistics only: a median/MAD based z so one wild point cannot inflate its own tolerance band,
 * plus two shape rules (a value that stops moving, and a gap far wider than the normal cadence).
 */
export const findAnomalies = (name: string, points: TimePoint[]): Anomaly[] => {
  if (points.length < MIN_SAMPLE) return [];
  const profile = profileSeries(name, points);
  const out: Anomaly[] = [];
  const scale = (profile.mad ?? 0) > 0 ? (profile.mad as number) : (profile.std ?? 0);
  if (scale > 0 && profile.median !== null) {
    points.forEach((point) => {
      const robustZ = (0.6745 * (point.value - profile.median!)) / scale;
      if (Math.abs(robustZ) >= 3.5) {
        out.push({
          name,
          timestamp: point.timestamp,
          value: point.value,
          rule: tx('偏离中位数（MAD 归一）'),
          score: tx('z={z}', { z: round(robustZ, 2) }),
        });
      }
    });
  }
  let run = 1;
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].value === points[i - 1].value) {
      run += 1;
      if (run === MIN_SAMPLE - 3) {
        out.push({
          name,
          timestamp: points[i].timestamp,
          value: points[i].value,
          rule: tx('连续不变（卡值）'),
          score: tx('≥{n} 点相同', { n: run }),
        });
      }
    } else {
      run = 1;
    }
  }
  if (profile.medianGapMs && profile.medianGapMs > 0) {
    points.slice(1).forEach((point, i) => {
      const gap = point.timestamp - points[i].timestamp;
      if (gap >= 5 * profile.medianGapMs!) {
        out.push({
          name,
          timestamp: point.timestamp,
          value: point.value,
          rule: tx('采样间隔突变'),
          score: tx('距上一点 {gap}，通常是 {median}', {
            gap: humanSpan(gap),
            median: humanSpan(profile.medianGapMs!),
          }),
        });
      }
    });
  }
  return out;
};

export const analyzeSeries = (read: Readout): SeriesAnalysis[] =>
  seriesFromRowset(read.rows).map(({ name, points }) => ({
    name,
    points,
    profile: profileSeries(name, points),
    anomalies: findAnomalies(name, points),
    sampleShort: points.length < MIN_SAMPLE,
  }));

export function qualityFindings(reads: QualityReads, now: number): Finding[] {
  const out = failedFindings([reads.devices, reads.last, reads.buckets, ...reads.points], '数据质量'); // i18n-ignore

  if (reads.devices.ok && reads.devices.rows.length === 0) {
    out.push({
      key: 'no-device',
      level: 'warn',
      group: '数据质量', // i18n-ignore
      title: tx('{path} 下面没有设备', { path: reads.path }),
      detail: tx('语句执行成功、返回 0 行：这个路径没有写入过数据，或者拼错了。这不是查询失败。'),
      advice: tx('先去路径浏览器确认设备名，再回来体检。'),
      evidence: { sql: reads.devices.sql, rows: [] },
    });
    return out;
  }

  const ttlCells = reads.devices.rows.map((row) => String(row['TTL(ms)'] ?? '').trim());
  const ttl = ttlCells.map((value) => num(value)).filter((value): value is number => value !== null);
  if (reads.devices.rows.length) {
    out.push({
      key: 'ttl',
      level: 'info',
      group: '数据质量', // i18n-ignore
      title: ttl.length
        ? tx('{n}/{total} 台设备设了保留期，最短 {span}', {
            n: ttl.length,
            total: reads.devices.rows.length,
            span: humanSpan(Math.min(...ttl)),
          })
        : ttlCells[0]
          ? tx('这些设备的 TTL(ms) 都是 {value}：数据不会自动过期', { value: ttlCells[0] })
          : tx('这些设备的 TTL(ms) 都是空：数据不会自动过期'),
      detail: ttl.length
        ? tx('到期数据由服务端按时间分区整块删除，不需要你写删除任务。')
        : tx('INF 是建库默认值，不算配置错误；它的意思是磁盘只增不减，而这一页读不到当前剩余空间，所以只能提示到这里。'),
      evidence: {
        sql: reads.devices.sql,
        rows: fewRows(reads.devices.rows, 6),
        note: tx('TTL 在 SHOW DEVICES 上才看得到：tree 模型的 SHOW DATABASES 只有 5 列，没有保留期。'),
      },
    });
  }

  if (reads.last.ok && reads.last.rows.length) {
    const stamps = reads.last.rows.map((row) => readTime(row)).filter((v): v is number => v !== null);
    if (stamps.length) {
      const newest = Math.max(...stamps);
      const oldest = Math.min(...stamps);
      const newestAge = now - newest;
      const skew = newestAge < 0;
      const staleCount = stamps.filter((ts) => now - ts > Math.max(newestAge + 1, 86400000)).length;
      out.push({
        key: 'freshness',
        level: newestAge > 86400000 ? 'warn' : 'pass',
        group: '数据质量', // i18n-ignore
        title: skew
          ? tx('最新的时间戳比浏览器当前时间还晚 {span}：两边时钟不一致', { span: humanSpan(-newestAge) })
          : tx('最新一次写入是 {newest}前，最久的一条是 {oldest}前', {
              newest: humanSpan(newestAge),
              oldest: humanSpan(now - oldest),
            }),
        detail: skew
          ? tx('服务端（或写入端）的时钟走在本机前面。按这个偏差算，最新一批点落在未来，所以"多久没写"这一项在这里不可用，只报时钟差。')
          : staleCount
            ? tx('{n}/{total} 条序列的时间戳比最新的那条老得多，写入不均匀。', { n: staleCount, total: stamps.length })
            : tx('所有序列的最近值时间戳彼此接近。'),
        evidence: {
          sql: reads.last.sql,
          rows: reads.last.rows
            .slice()
            .sort((a, b) => (readTime(b) ?? 0) - (readTime(a) ?? 0))
            .slice(0, 6),
          note: tx('时间戳来自 timestamps 这一路，SELECT last * 的值/类型在 column_names 里。'),
        },
      });
    }
  }

  if (reads.buckets.ok && reads.buckets.rows.length) {
    const series = seriesFromRowset(reads.buckets.rows);
    const emptyRatio = (points: TimePoint[]) =>
      points.length ? points.filter((point) => point.value === 0).length / points.length : 0;
    const gaps = series
      .map((item) => ({ ...item, ratio: emptyRatio(item.points) }))
      .filter((item) => item.ratio >= 0.5)
      .sort((a, b) => b.ratio - a.ratio);
    const overall = emptyRatio(series.flatMap((item) => item.points));
    out.push({
      key: 'buckets',
      level: gaps.length && overall >= 0.5 ? 'warn' : 'pass',
      group: '数据质量', // i18n-ignore
      title: tx('{n} 个时间分桶里 {pct}% 的计数是 0', {
        n: reads.buckets.rows.length,
        pct: Math.round(overall * 100),
      }),
      detail: gaps.length
        ? tx('{n} 条序列有一半以上的分桶没有点，最空的这条是 {name}（{pct}%）。', {
            n: gaps.length,
            name: seriesName(gaps[0].name, reads.path),
            pct: Math.round(gaps[0].ratio * 100),
          })
        : tx('每个分桶都有数据。'),
      evidence: {
        sql: reads.buckets.sql,
        rows: fewRows(reads.buckets.rows, 8),
        note: tx('分桶为 0 既可能是没写，也可能是这条序列那时还不存在，从计数上区分不出来。'),
      },
    });
  }

  const analyses = reads.points.flatMap((read) => analyzeSeries(read));
  const usable = analyses.filter((item) => !item.sampleShort);
  const anomalies = usable.flatMap((item) => item.anomalies);
  if (analyses.length) {
    out.push({
      key: 'sample',
      level: usable.length ? (anomalies.length ? 'critical' : 'pass') : 'info',
      group: '数据质量', // i18n-ignore
      title: usable.length
        ? anomalies.length
          ? tx('{n} 个点被判为异常（{series} 条序列样本充足）', { n: anomalies.length, series: usable.length })
          : tx('{n} 条序列没有异常点（跳变 / 卡值 / 间隔突变）', { n: usable.length })
        : tx('样本太少，这一项不下结论：最多的一条序列只有 {n} 个点', {
            n: Math.max(...analyses.map((item) => item.points.length)),
          }),
      detail: usable.length
        ? tx('判定用的是 MAD 归一的偏离度（阈值 3.5）、连续 {short} 点以上不变、间隔超过中位数 5 倍这三条规则。', {
            short: MIN_SAMPLE - 3,
          })
        : tx('偏离统计至少需要 {min} 个点；这台机器上抽到的序列只有几个点，任何"异常"判定都是假信号，所以宁可空着。', {
            min: MIN_SAMPLE,
          }),
      evidence: {
        sql: reads.points[0].sql,
        rows: analyses.slice(0, 6).map((item) => ({
          序列: seriesName(item.name, reads.path), // i18n-ignore
          点数: item.profile.points, // i18n-ignore
          最小值: item.profile.min ?? '-', // i18n-ignore
          最大值: item.profile.max ?? '-', // i18n-ignore
          中位数: item.profile.median ?? '-', // i18n-ignore
          MAD: item.profile.mad ?? '-',
          中位间隔: item.profile.medianGapMs ? humanSpan(item.profile.medianGapMs) : '-', // i18n-ignore
          最后一点: item.profile.lastTs ? formatTimestamp(item.profile.lastTs) : '-', // i18n-ignore
        })),
        note: tx('每台设备各跑一次取原始点，这里显示第一台的语句。'),
      },
    });
  }

  return out;
}

/** Series columns arrive fully qualified; the tail is the part a person scans. */
export const seriesName = (title: string, path: string): string => {
  const trimmed = title.replace(/^(count|sum|avg|min_time|max_time|stddev)\(/, '').replace(/\)$/, '');
  const prefix = path.replace(/\.\*\*?$/, '');
  return trimmed.startsWith(`${prefix}.`) ? trimmed.slice(prefix.length + 1) : trimmed;
};

export const LEVEL_WEIGHT: Record<FindingLevel, number> = { critical: 0, warn: 1, info: 2, pass: 3 };

export const sortBySeverity = (findings: Finding[]): Finding[] =>
  [...findings].sort((a, b) => LEVEL_WEIGHT[a.level] - LEVEL_WEIGHT[b.level]);
