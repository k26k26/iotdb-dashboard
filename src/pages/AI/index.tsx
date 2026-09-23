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

import React, { useCallback, useMemo, useState } from 'react';
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';
import TimeSeriesChart from '../../components/TimeSeriesChart';
import { WINDOWS, readCluster, readQuality } from '../../services/analysis';
import { normalizePath } from '../../utils/path';
import { formatTimestamp } from '../../utils/formatter';
import {
  clusterFindings,
  scheduleFindings,
  findAnomalies,
  qualityFindings,
  seriesFromRowset,
  seriesName,
  sortBySeverity,
} from '../../utils/analysis';
import type { Finding, FindingLevel, Readout } from '../../utils/analysis';
import type { QualityReads } from '../../utils/analysis';

const { Title, Paragraph, Text } = Typography;

const LEVEL_META: Record<FindingLevel, { label: string; color: string }> = {
  critical: { label: '严重', color: 'red' },
  warn: { label: '注意', color: 'orange' },
  info: { label: '提示', color: 'blue' },
  pass: { label: '通过', color: 'green' },
};

const cell = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (key === '__time') return formatTimestamp(Number(value));
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

const EvidenceTable: React.FC<{ rows: Record<string, unknown>[] }> = ({ rows }) => {
  if (!rows.length) return <Text type="secondary">这条语句这次没有返回行。</Text>;
  const columns = Object.keys(rows[0])
    .filter((key) => key !== 'key')
    .map((key) => ({
      title: key,
      dataIndex: key,
      key,
      render: (_: unknown, record: Record<string, unknown>) => cell(key, record[key]),
    }));
  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey={(record) => JSON.stringify(record)}
      size="small"
      pagination={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

const FindingCard: React.FC<{ finding: Finding }> = ({ finding }) => {
  const meta = LEVEL_META[finding.level];
  return (
    <Card
      size="small"
      title={
        <Space>
          <Tag color={meta.color}>{meta.label}</Tag>
          <span>{finding.title}</span>
        </Space>
      }
    >
      <Paragraph style={{ marginBottom: 8 }}>{finding.detail}</Paragraph>
      {finding.advice && (
        <Paragraph style={{ marginBottom: 8 }}>
          <Text type="secondary">可以怎么做：</Text>
          {finding.advice}
        </Paragraph>
      )}
      <Collapse
        size="small"
        items={[
          {
            key: 'evidence',
            label: `来源：${finding.evidence.sql.split('\n')[0].slice(0, 60)}${finding.evidence.sql.length > 60 ? '…' : ''}`,
            children: (
              <>
                <Paragraph copyable={{ text: finding.evidence.sql }} style={{ marginBottom: 8 }}>
                  <Text code>{finding.evidence.sql}</Text>
                </Paragraph>
                {finding.evidence.note && (
                  <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                    {finding.evidence.note}
                  </Paragraph>
                )}
                <EvidenceTable rows={finding.evidence.rows} />
              </>
            ),
          },
        ]}
      />
    </Card>
  );
};

/** The chart only ever draws one device, so say which one and stop pretending it is the whole path. */
const ChartPanel: React.FC<{ read: Readout; path: string }> = ({ read, path }) => {
  const chart = useMemo(() => {
    const series = seriesFromRowset(read.rows);
    const stamps = [...new Set(series.flatMap((item) => item.points.map((point) => point.timestamp)))].sort(
      (a, b) => a - b
    );
    return {
      stamps,
      series: series.map((item) => {
        const byTime = new Map(item.points.map((point) => [point.timestamp, point.value]));
        return {
          name: seriesName(item.name, path),
          data: stamps.map((stamp) => byTime.get(stamp) ?? null),
        };
      }),
      anomalies: series.flatMap((item) =>
        findAnomalies(item.name, item.points).map((anomaly) => ({
          ...anomaly,
          name: seriesName(anomaly.name, path),
        }))
      ),
    };
  }, [read, path]);

  if (!chart.stamps.length) {
    return <Alert type="info" showIcon title={`${read.label} 没有取到数值点`} description="这台机器上这条设备序列为空，或者值不是数值（TEXT/BOOLEAN 不参与统计）。" />;
  }

  return (
    <TimeSeriesChart
      title={read.label}
      subtitle={`曲线只画这一台设备；结论覆盖的是 ${path} 整个路径`}
      xAxisData={chart.stamps}
      series={chart.series}
      markers={chart.anomalies.map((anomaly) => ({ x: anomaly.timestamp, y: anomaly.value }))}
      height={320}
    />
  );
};

const AIAnalysis: React.FC = () => {
  const [path, setPath] = useState('root.mtwarn_ts');
  const [windowKey, setWindowKey] = useState('7d');
  const [deviceLimit, setDeviceLimit] = useState(5);
  const [pointLimit, setPointLimit] = useState(1000);
  const [pathError, setPathError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [quality, setQuality] = useState<QualityReads | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();

  const handleRun = useCallback(async () => {
    const normalized = normalizePath(path);
    if (!normalized) {
      setPathError(
        '路径只能是点号分隔的名字：不能带引号、反斜杠、空格或通配符（通配符本页自己加）。'
      );
      message.warning('路径格式不对，没有发语句');
      return;
    }
    setPathError(null);
    setLoading(true);
    const started = Date.now();
    try {
      const [cluster, reads] = await Promise.all([
        readCluster(),
        readQuality({ path: normalized, windowKey, deviceLimit, pointLimit }),
      ]);
      setQuality(reads);
      setFindings(
        sortBySeverity([
          ...clusterFindings(cluster),
          ...scheduleFindings(cluster),
          ...qualityFindings(reads, Date.now()),
        ])
      );
      setElapsed(Date.now() - started);
      setFinishedAt(Date.now());
    } finally {
      setLoading(false);
    }
  }, [path, windowKey, deviceLimit, pointLimit, message]);

  const grouped = useMemo(() => {
    const map = new Map<string, Finding[]>();
    findings.forEach((finding) => {
      map.set(finding.group, [...(map.get(finding.group) || []), finding]);
    });
    return [...map.entries()];
  }, [findings]);

  const counts = useMemo(
    () => ({
      critical: findings.filter((item) => item.level === 'critical').length,
      warn: findings.filter((item) => item.level === 'warn').length,
      info: findings.filter((item) => item.level === 'info').length,
      pass: findings.filter((item) => item.level === 'pass').length,
    }),
    [findings]
  );

  return (
    <div>
      <Title level={3}>AI 分析</Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="这一页不调用任何模型：每条结论都是服务端真实返回算出来的"
        description={
          <>
            这是个纯静态前端：没有服务端中转，也没有密钥，所以"智能"这一半只能是本地规则加鲁棒统计
            （中位数 / MAD / 间隔漂移），而不是某个大模型的看法。每条结论都能展开看到它依据的语句和原始行，
            你可以把语句原样粘到查询页复现。读不到的语句会作为「没读到」列出来，不会渲染成"暂无数据"。
            样本太少时检测器会明说"这一项不下结论"——它不会为了看起来有内容而报异常。
          </>
        }
      />

      <Card title="体检范围" size="small" style={{ marginBottom: 16 }}>
        <Space wrap align="start">
          <div>
            <div style={{ marginBottom: 4 }}>路径</div>
            <Input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="root.mtwarn_ts"
              style={{ width: 220 }}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>时间窗</div>
            <Select
              value={windowKey}
              onChange={setWindowKey}
              style={{ width: 140 }}
              options={Object.entries(WINDOWS).map(([key, item]) => ({ value: key, label: item.label }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>体检设备数</div>
            <InputNumber min={1} max={50} value={deviceLimit} onChange={(value) => setDeviceLimit(value ?? 5)} />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>每台点数上限</div>
            <InputNumber
              min={1}
              max={5000}
              value={pointLimit}
              onChange={(value) => setPointLimit(value ?? 1000)}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>&nbsp;</div>
            <Button type="primary" icon={<ExperimentOutlined />} loading={loading} onClick={handleRun}>
              开始体检
            </Button>
          </div>
        </Space>
        {pathError && (
          <Alert type="error" showIcon style={{ marginTop: 12 }} title="路径没有发出去" description={pathError} />
        )}
        <div style={{ marginTop: 12, color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
          一次体检发十来条语句（集群 6 条 + 设备清单/最近值/分桶 3 条 + 每台设备 1 条）。
          结论是点出来的，不是常驻刷新的{finishedAt ? `：最近一次 ${formatTimestamp(finishedAt)}` : ''}。
        </div>
      </Card>

      {findings.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small">
              <Statistic title="结论" value={findings.length} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small">
              <Statistic title="严重" value={counts.critical} styles={{ content: { color: counts.critical ? '#cf1322' : undefined } }} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small">
              <Statistic title="注意" value={counts.warn} styles={{ content: { color: counts.warn ? '#d46b08' : undefined } }} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small">
              <Statistic title="提示" value={counts.info} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small">
              <Statistic title="通过" value={counts.pass} styles={{ content: { color: '#237804' } }} />
            </Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card size="small">
              <Statistic title="采集耗时" value={elapsed === null ? '-' : `${(elapsed / 1000).toFixed(2)} 秒`} />
            </Card>
          </Col>
        </Row>
      )}

      {findings.length === 0 && !loading ? (
        <Card size="small">
          <Alert
            type="info"
            showIcon
            title="还没跑过体检"
            description="填好路径点「开始体检」。这一页不会自己替你判断该看哪台设备——范围得由你定。"
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {grouped.map(([group, items]) => (
            <Card key={group} title={`${group}（${items.length}）`} size="small">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {items.map((finding) => (
                  <FindingCard key={finding.key} finding={finding} />
                ))}
              </div>
            </Card>
          ))}

          {quality?.points.length ? (
            <Card title="抽到的原始点（只画第一台设备）" size="small">
              <ChartPanel read={quality.points[0]} path={quality.path} />
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;
