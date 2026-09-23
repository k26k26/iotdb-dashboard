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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Tag, Table, Typography } from 'antd';
import {
  ClusterOutlined,
  ApiOutlined,
  DatabaseOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { getNodes, getServices, getConnections, getCurrentQueries } from '../../services/metadata';
import type { NodeInfo, ServiceInfo, ConnectionInfo, CurrentQuery } from '../../types/api';
import { isServiceUp, formatMillis, queryColumns } from '../../utils/cluster';
import { useI18n } from '../../i18n';

const { Title } = Typography;

const ClusterManagement: React.FC = () => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [queries, setQueries] = useState<CurrentQuery[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [nodesResult, servicesResult, connectionsResult, queriesResult] = await Promise.allSettled([
      getNodes(),
      getServices(),
      getConnections(),
      getCurrentQueries(),
    ]);
    const failures: string[] = [];
    const read = <T,>(label: string, result: PromiseSettledResult<T[]>): T[] => {
      if (result.status === 'fulfilled') return result.value;
      failures.push(`${label}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      return [];
    };
    setNodes(read(t('节点'), nodesResult));
    setServices(read(t('服务'), servicesResult));
    setConnections(read(t('连接'), connectionsResult));
    setQueries(read(t('运行中查询'), queriesResult));
    setErrors(failures);
    setLoading(false);
  }, [t]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const dataNodes = useMemo(() => nodes.filter((node) => node.nodeType === 'DataNode'), [nodes]);
  const configNodes = useMemo(() => nodes.filter((node) => node.nodeType === 'ConfigNode'), [nodes]);

  const renderNodeList = (list: NodeInfo[], empty: string) =>
    list.length === 0 ? (
      <Alert description={empty} type="info" showIcon />
    ) : (
      list.map((node) => (
        <div key={node.nodeId} style={{ marginBottom: 8 }}>
          <Tag color={isServiceUp(node.status) ? 'success' : 'error'}>{node.status}</Tag>
          <span>#{node.nodeId}</span>
          <span style={{ color: '#888', marginLeft: 8 }}>
            {node.internalAddress}:{node.internalPort}
          </span>
          <span style={{ color: '#bbb', marginLeft: 8 }}>v{node.version}</span>
        </div>
      ))
    );

  return (
    <div>
      <Title level={3}>{t('集群管理')}</Title>

      <Spin spinning={loading}>
        {errors.length > 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            title={t('部分数据加载失败')}
            description={errors.join('; ')}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('总节点数')}
                value={nodes.length}
                prefix={<ClusterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('数据节点')}
                value={dataNodes.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('配置节点')}
                value={configNodes.length}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('当前连接')}
                value={connections.length}
                prefix={<WifiOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title={t('数据节点')} size="small">
              {renderNodeList(dataNodes, t('暂无数据节点'))}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t('配置节点')} size="small">
              {renderNodeList(configNodes, t('暂无配置节点'))}
            </Card>
          </Col>
        </Row>

        <Card title={t('服务状态')} size="small" style={{ marginTop: 24 }}>
          {services.length === 0 ? (
            <Alert description={t('暂无服务数据')} type="info" showIcon />
          ) : (
            <Table
              dataSource={services.map((svc) => ({ ...svc, key: `${svc.serviceName}-${svc.dataNodeId}` }))}
              columns={[
                { title: t('服务'), dataIndex: 'serviceName', key: 'serviceName' },
                { title: 'DataNode', dataIndex: 'dataNodeId', key: 'dataNodeId' },
                {
                  title: t('状态'),
                  dataIndex: 'state',
                  key: 'state',
                  render: (state: string) => (
                    <Tag color={isServiceUp(state) ? 'success' : 'default'}>{state}</Tag>
                  ),
                },
              ]}
              size="small"
              pagination={false}
            />
          )}
        </Card>

        <Card title={t('运行中查询')} size="small" style={{ marginTop: 24 }}>
          {queries.length === 0 ? (
            <Alert description={t('暂无运行中查询')} type="info" showIcon />
          ) : (
            <Table
              dataSource={queries.map((q) => ({ ...q, key: q.queryId }))}
              columns={queryColumns}
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>

        <Card title={t('当前连接')} size="small" style={{ marginTop: 24 }}>
          {connections.length === 0 ? (
            <Alert description={t('暂无连接')} type="info" showIcon />
          ) : (
            <Table
              dataSource={connections.map((c) => ({ ...c, key: `${c.dataNodeId}-${c.sessionId}` }))}
              columns={[
                { title: 'Client IP', dataIndex: 'clientIp', key: 'clientIp' },
                { title: 'User', dataIndex: 'userName', key: 'userName' },
                { title: 'Session', dataIndex: 'sessionId', key: 'sessionId' },
                { title: 'DataNode', dataIndex: 'dataNodeId', key: 'dataNodeId' },
                {
                  title: 'Last Active',
                  dataIndex: 'lastActiveTime',
                  key: 'lastActiveTime',
                  render: (value: number) => formatMillis(value),
                },
              ]}
              size="small"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default ClusterManagement;
