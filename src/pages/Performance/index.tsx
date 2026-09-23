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

import React, { useCallback, useEffect, useState } from 'react';
import { App as AntdApp, Alert, Button, Card, Col, Row, Spin, Statistic, Table, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { queryRows, queryTableRows } from '../../services/rest';
import { t, tx, useI18n } from '../../i18n';
import type { Text as I18nText } from '../../i18n';

const { Title } = Typography;

const describe = (err: any): string => err.response?.data?.message || err.message || t('请求失败');

/** Puts the quoted statements back where the sentence left them out, so each notice stays one string. */
const quoted = (text: string, codes: string[]): React.ReactNode[] =>
  text.split(/(\{c\d+\})/).map((part, i) =>
    part.startsWith('{c') ? <code key={i}>{codes[Number(part.slice(2, -1))]}</code> : part
  );

/** The statements and identifiers the slow-query notice quotes, in the order the text names them. */
const SLOW_CODES = [
  'SHOW SLOW QUERIES',
  'SHOW PERFORMANCE ADVICE',
  "no viable alternative at input 'SHOW SLOW'",
  "mismatched input 'SLOW'",
  'Coordinator.recordQueries()',
  'slow_query_threshold',
  'logs/log_datanode_slow_sql.log',
  'SHOW VARIABLES',
];

/** The server reports these timings as FLOAT seconds, which is far too coarse a unit to read. */
const asMillis = (seconds: unknown): string => {
  const value = Number(seconds);
  return Number.isFinite(value) ? `${(value * 1000).toFixed(1)} ms` : '-';
};

/** Consensus classes arrive as Java FQCNs; the package is noise next to the name. */
const lastSegment = (fqcn: unknown): string =>
  typeof fqcn === 'string' && fqcn ? fqcn.split('.').pop() || fqcn : '-';

/**
 * Keys `SHOW VARIABLES` really answers for, with what each one controls and the property it comes from.
 * Nothing here is a verdict about this cluster -- it is the readable half of tuning context.
 */
const CONFIG_FACTS: {
  key: string;
  label: I18nText;
  meaning: I18nText;
  property: string;
  render?: (value: unknown) => string;
}[] = [
  {
    key: 'ReadConsistencyLevel',
    label: tx('读一致性'),
    meaning: tx('strong 时每次读都过一遍共识确认，弱一致性可以直接读本地'),
    property: 'read_consistency_level',
  },
  {
    key: 'DataReplicationFactor',
    label: tx('数据副本因子'),
    meaning: tx('写入需要落几个数据副本；1 最快，但也意味着没有第二份'),
    property: 'data_replication_factor',
  },
  {
    key: 'SchemaReplicationFactor',
    label: tx('Schema 副本因子'),
    meaning: tx('库/设备/时间序列这些元数据的副本数'),
    property: 'schema_replication_factor',
  },
  {
    key: 'DataRegionConsensusProtocolClass',
    label: tx('数据共识协议'),
    meaning: tx('决定写路径的复制方式，换协议会直接改变读写开销'),
    property: 'data_region_consensus_protocol_class',
    render: lastSegment,
  },
  {
    key: 'TimePartitionInterval',
    label: tx('时间分区间隔'),
    meaning: tx('一个时间分区的跨度，决定 region 数量和查询要扫多少个分区'),
    property: 'time_partition_interval',
    render: (v: unknown) => t('{n} 分钟（{ms} ms）', { n: Number(v) / 60000, ms: String(v) }),
  },
  {
    key: 'SeriesSlotNum',
    label: tx('Series Slot 数'),
    meaning: tx('时间线到 region 的分片基数，决定写入和查询的并行上限'),
    property: 'series_slot_num',
  },
  {
    key: 'DiskSpaceWarningThreshold',
    label: tx('磁盘水位阈值'),
    meaning: tx('剩余空间低于这个比例时服务端把它标记为告警水位'),
    property: 'disk_space_warning_threshold',
  },
  {
    key: 'TimestampPrecision',
    label: tx('时间戳精度'),
    meaning: tx('本页所有毫秒数字都按它解释'),
    property: 'timestamp_precision',
  },
];

/**
 * There is no slow-query view in this build: `SHOW SLOW QUERIES` and `SHOW PERFORMANCE ADVICE` are not
 * grammar on either model, and `Coordinator.recordQueries()` only ever writes a statement over
 * `slow_query_threshold` into the DataNode's `logs/log_datanode_slow_sql.log`. So this page shows what the
 * server does answer -- live queries, the latency histogram, and the readable config -- and says what each
 * one cannot prove.
 */
const PerformanceTuning: React.FC = () => {
  const [queries, setQueries] = useState<Record<string, any>[]>([]);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [bins, setBins] = useState<{ bin: string; nums: number }[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [running, variables, histogram] = await Promise.allSettled([
      queryRows('SHOW QUERIES'),
      queryRows('SHOW VARIABLES'),
      queryTableRows('SELECT bin, nums FROM information_schema.queries_costs_histogram'),
    ]);
    const failed: string[] = [];
    if (running.status === 'fulfilled') {
      setQueries(
        [...running.value].sort((a, b) => Number(b.ElapsedTime) - Number(a.ElapsedTime))
      );
    } else {
      setQueries([]);
      failed.push(`SHOW QUERIES: ${describe(running.reason)}`);
    }
    if (variables.status === 'fulfilled') {
      setVars(Object.fromEntries(variables.value.map((row) => [String(row.Variable), String(row.Value)])));
    } else {
      setVars({});
      failed.push(`SHOW VARIABLES: ${describe(variables.reason)}`);
    }
    if (histogram.status === 'fulfilled') {
      setBins(histogram.value.map((row) => ({ bin: String(row.bin), nums: Number(row.nums) })));
    } else {
      setBins([]);
      failed.push(`queries_costs_histogram: ${describe(histogram.reason)}`);
    }
    setErrors(failed);
    if (failed.length) message.error(t('部分数据没取到：{detail}', { detail: failed[0] }));
    setLoading(false);
  }, [message, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const slowest = queries.length ? Number(queries[0].ElapsedTime) : null;
  const recorded = bins.filter((row) => row.nums > 0);

  const queryColumns = [
    { title: 'Query ID', dataIndex: 'QueryId', key: 'QueryId', ellipsis: true },
    { title: 'DataNode', dataIndex: 'DataNodeId', key: 'DataNodeId' },
    {
      title: t('耗时'),
      dataIndex: 'ElapsedTime',
      key: 'ElapsedTime',
      render: (value: number) => asMillis(value),
    },
    {
      title: t('排队时间'),
      dataIndex: 'WaitTimeInServer',
      key: 'WaitTimeInServer',
      render: (value: number) => asMillis(value),
    },
    { title: t('语句'), dataIndex: 'Statement', key: 'Statement', ellipsis: true },
    {
      title: t('客户端'),
      dataIndex: 'ClientIp',
      key: 'ClientIp',
      ellipsis: true,
      render: (value: string) => value || '-',
    },
  ];

  return (
    <div>
      <Title level={3}>{t('性能调优')}</Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title={t('这一页列不出「慢查询」：服务端只把它写进日志')}
        description={quoted(
          t('{c0} 和 {c1} 都不是语句——前者在 tree 模型上回 {c2}，在 table 模型上回 {c3}。真实的慢查询机制是 {c4}：执行时间超过 {c5}（源码默认 10000 毫秒）就把它写进 DataNode 的 {c6}，没有任何 SQL 视图能读回这个文件，而这个阈值也不在 {c7} 返回的那 15 项里，页面连它现在是多少都问不到。 右边这两张表因此不叫「慢查询列表」：一张是**此刻正在执行**的查询，一张是服务端的耗时直方图。'),
          SLOW_CODES
        )}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t('正在执行的查询')} value={queries.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t('其中最久')} value={slowest === null ? '-' : asMillis(slowest)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t('耗时直方图非零桶')} value={`${recorded.length} / ${bins.length || 61}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic title={t('数据副本因子')} value={vars.DataReplicationFactor ?? '-'} />
          </Card>
        </Col>
      </Row>

      {errors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          title={t('部分面板这次没取到')}
          description={errors.map((line) => <div key={line}>{line}</div>)}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Card
          title={t('正在执行的查询（SHOW QUERIES）')}
          size="small"
          extra={
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              {t('刷新')}
            </Button>
          }
        >
          <Spin spinning={loading}>
            <Table
              dataSource={queries}
              columns={queryColumns}
              rowKey={(record) => String(record.QueryId)}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 10 }}
              locale={{
                emptyText: t('没有查询在跑，或者只有这次抓取自己（REST 是同步执行，一条语句跑完就消失了）'),
              }}
            />
          </Spin>
        </Card>

        <Card title={t('耗时分布（information_schema.queries_costs_histogram）')} size="small">
          {bins.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              title={t('读不到直方图')}
              description={t('这个表在部分版本上没有；上面列出了具体原因。')}
            />
          ) : recorded.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              title={t('{n} 个桶全部为 0：这不能当作「没有慢查询」', { n: bins.length })}
              description={t('服务端只在指标模块开启时才往这些桶里计数，本机没在采集，所以「全 0」既可能是没慢查询、也可能是压根没统计，从这一页区分不出来。要确认，去看 DataNode 的 logs/log_datanode_slow_sql.log。')}
            />
          ) : (
            <Table
              dataSource={recorded.map((row) => ({ ...row, key: row.bin }))}
              columns={[
                { title: t('耗时分桶（秒）'), dataIndex: 'bin', key: 'bin' },
                { title: t('条数'), dataIndex: 'nums', key: 'nums' },
              ]}
              size="small"
              pagination={false}
            />
          )}
        </Card>

        <Card title={t('读得到的配置项')} size="small">
          <Table
            dataSource={CONFIG_FACTS.filter((item) => vars[item.key] !== undefined).map((item) => ({
              ...item,
              key: item.key,
              label: t(item.label),
              meaning: t(item.meaning),
            }))}
            columns={[
              { title: t('配置'), dataIndex: 'label', key: 'label' },
              {
                title: t('当前值'),
                dataIndex: 'key',
                key: 'value',
                render: (_: unknown, record: Omit<(typeof CONFIG_FACTS)[number], 'label' | 'meaning'>) =>
                  record.render ? record.render(vars[record.key]) : vars[record.key],
              },
              { title: t('它影响什么'), dataIndex: 'meaning', key: 'meaning' },
              { title: t('对应参数'), dataIndex: 'property', key: 'property' },
            ]}
            size="small"
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: t('SHOW VARIABLES 没有返回，这一栏暂时是空的') }}
          />
          <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
            {quoted(
              t('这一栏不是自动诊断结论：它只列 {c0} 真回答出来的键，以及这些键管什么。 改哪个值、改成多少，得按业务写入量和硬件定，本页不替你猜。'),
              ['SHOW VARIABLES']
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceTuning;
