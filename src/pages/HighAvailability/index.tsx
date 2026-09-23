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
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Col,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { queryRows } from '../../services/rest';
import { t, useI18n } from '../../i18n';

const { Title } = Typography;

const describe = (err: any): string => err.response?.data?.message || err.message || t('请求失败');

/** The consensus classes arrive as Java FQCNs; only the last segment is worth reading. */
const protocol = (fqcn: unknown): string =>
  typeof fqcn === 'string' && fqcn ? fqcn.split('.').pop() || fqcn : '-';

const isRunning = (status: unknown): boolean => String(status) === 'Running';

interface DbHealth {
  database: string;
  schemaReplication: string;
  dataReplication: string;
  schemaRegions: number;
  dataRegions: number;
  nodes: string[];
  unhealthy: number;
  required: number;
}

/**
 * Redundancy is per-database: the factors come from SHOW DATABASES and the placement from SHOW REGIONS.
 * A database only survives a node loss when that many distinct DataNodes actually hold its regions, so
 * a factor of 2 on a one-node cluster is not redundancy.
 */
const verdictOf = (row: DbHealth): { text: string; color: string } => {
  if (row.unhealthy) return { text: t('{n} 个 region 非 Running', { n: row.unhealthy }), color: 'error' };
  if (row.required <= 1) return { text: t('单点：承载节点宕机即中断'), color: 'warning' };
  if (row.nodes.length < row.required) {
    return { text: t('副本不足：需要 {n} 个节点，只有 {m} 个', { n: row.required, m: row.nodes.length }), color: 'error' };
  }
  return { text: t('有冗余'), color: 'success' };
};

const HighAvailability: React.FC = () => {
  const [nodes, setNodes] = useState<Record<string, any>[]>([]);
  const [databases, setDatabases] = useState<Record<string, any>[]>([]);
  const [regions, setRegions] = useState<Record<string, any>[]>([]);
  const [vars, setVars] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const statements = ['SHOW CLUSTER', 'SHOW DATABASES', 'SHOW REGIONS', 'SHOW VARIABLES'];
    const settled = await Promise.allSettled(statements.map((sql) => queryRows(sql)));
    const failed: string[] = [];
    settled.forEach((entry, i) => {
      if (entry.status === 'rejected') failed.push(`${statements[i]}: ${describe(entry.reason)}`);
    });
    const lists = settled.map((entry) => (entry.status === 'fulfilled' ? entry.value : []));
    const [cluster, dbs, regs, variables] = lists;
    setNodes(cluster);
    setDatabases(dbs);
    setRegions(regs);
    setVars(Object.fromEntries(variables.map((row) => [String(row.Variable), row.Value])));
    setErrors(failed);
    setLoading(false);
    if (failed.length) message.error(t('部分数据加载失败: {msg}', { msg: failed[0] }));
  }, [message, t]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const healthy = nodes.filter((node) => isRunning(node.Status)).length;

  const health: DbHealth[] = databases.map((db) => {
    const database = String(db.Database ?? '');
    const owned = regions.filter((region) => String(region.Database ?? '') === database);
    const schemaRF = Number(db.SchemaReplicationFactor) || 0;
    const dataRF = Number(db.DataReplicationFactor) || 0;
    return {
      database,
      schemaReplication: String(db.SchemaReplicationFactor ?? '-'),
      dataReplication: String(db.DataReplicationFactor ?? '-'),
      schemaRegions: owned.filter((region) => region.Type === 'SchemaRegion').length,
      dataRegions: owned.filter((region) => region.Type === 'DataRegion').length,
      nodes: [
        ...new Set(owned.map((region) => String(region.DataNodeId)).filter((id) => id !== 'undefined')),
      ],
      unhealthy: owned.filter((region) => !isRunning(region.Status)).length,
      required: Math.max(schemaRF, dataRF),
    };
  });

  return (
    <div>
      <Title level={3}>{t('高可用监控')}</Title>

      {errors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={t('部分集群状态读不到')}
          description={errors.join('; ')}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t('运行中节点')} value={healthy} suffix={`/ ${nodes.length}`} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t('Schema 共识')} value={protocol(vars.SchemaRegionConsensusProtocolClass)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title={t('Data 共识')} value={protocol(vars.DataRegionConsensusProtocolClass)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('单点数据库')}
              value={health.filter((row) => row.required <= 1).length}
              suffix={`/ ${health.length}`}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={t('冗余与故障转移')}
        size="small"
        extra={<Button icon={<ReloadOutlined />} onClick={fetchAll}>{t('刷新')}</Button>}
        style={{ marginBottom: 16 }}
      >
        <Spin spinning={loading}>
          <Table
            dataSource={health}
            rowKey={(record) => record.database}
            size="small"
            pagination={{ pageSize: 20 }}
            columns={[
              { title: t('数据库'), dataIndex: 'database', key: 'database' },
              { title: t('Schema 副本因子'), dataIndex: 'schemaReplication', key: 'schemaReplication' },
              { title: t('Data 副本因子'), dataIndex: 'dataReplication', key: 'dataReplication' },
              { title: 'Schema Region', dataIndex: 'schemaRegions', key: 'schemaRegions' },
              { title: 'Data Region', dataIndex: 'dataRegions', key: 'dataRegions' },
              {
                title: t('承载节点'),
                dataIndex: 'nodes',
                key: 'nodes',
                render: (ids: string[]) => (ids.length ? ids.join(', ') : '-'),
              },
              {
                title: t('结论'),
                key: 'verdict',
                render: (_: unknown, record: DbHealth) => {
                  const verdict = verdictOf(record);
                  return <Tag color={verdict.color}>{verdict.text}</Tag>;
                },
              },
            ]}
            locale={{
              emptyText: (
                <Alert
                  type="info"
                  showIcon
                  title={t('集群里还没有数据库')}
                  description={t('SHOW DATABASES 返回了空列表，没有可评估冗余的对象。')}
                />
              ),
            }}
          />
        </Spin>
      </Card>

      <Card title={t('集群节点（SHOW CLUSTER）')} size="small">
        <Spin spinning={loading}>
          <Table
            dataSource={nodes}
            rowKey={(record) => `${record.NodeType}-${record.NodeID}`}
            size="small"
            pagination={{ pageSize: 20 }}
            columns={[
              { title: 'NodeID', dataIndex: 'NodeID', key: 'NodeID' },
              { title: t('类型'), dataIndex: 'NodeType', key: 'NodeType' },
              {
                title: t('状态'),
                dataIndex: 'Status',
                key: 'Status',
                render: (status: string) => (
                  <Tag color={isRunning(status) ? 'success' : 'error'}>{status}</Tag>
                ),
              },
              {
                title: t('内部地址'),
                key: 'address',
                render: (_: unknown, record: Record<string, any>) =>
                  `${record.InternalAddress ?? '-'}:${record.InternalPort ?? '-'}`,
              },
              { title: t('版本'), dataIndex: 'Version', key: 'Version' },
              { title: t('构建'), dataIndex: 'BuildInfo', key: 'BuildInfo' },
            ]}
            locale={{
              emptyText: (
                <Alert
                  type="info"
                  showIcon
                  title={t('SHOW CLUSTER 没有返回节点')}
                  description={t('查询成功但列表为空。这一句没有 uptime / 心跳列，节点存活只能看 Status。')}
                />
              ),
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default HighAvailability;
