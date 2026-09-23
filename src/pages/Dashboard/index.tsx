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
import { Card, Row, Col, Statistic, Spin, Alert, Tag, Table, Typography } from 'antd';
import {
  DatabaseOutlined,
  ApiOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import { getNodes, getServices, getConnections, getCurrentQueries } from '../../services/metadata';
import type { NodeInfo, ServiceInfo, ConnectionInfo, CurrentQuery } from '../../types/api';
import { isServiceUp, formatMillis, queryColumns } from '../../utils/cluster';
import { useI18n } from '../../i18n';

const { Title } = Typography;

const Dashboard: React.FC = () => {
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

  return (
    <div>
      <Title level={3}>{t('IoTDB 仪表盘')}</Title>

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
                title={t('节点数量')}
                value={nodes.length}
                prefix={<ClusterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('服务数量')}
                value={services.length}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('当前连接')}
                value={connections.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title={t('运行中查询')}
                value={queries.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title={t('节点概览')} size="small">
              {nodes.length === 0 ? (
                <Alert description={t('暂无节点数据')} type="info" showIcon />
              ) : (
                nodes.map((node) => (
                  <div key={node.nodeId} style={{ marginBottom: 8 }}>
                    <Tag color={node.nodeType === 'ConfigNode' ? 'blue' : 'geekblue'}>
                      {node.nodeType}
                    </Tag>
                    <Tag color={isServiceUp(node.status) ? 'success' : 'error'}>{node.status}</Tag>
                    <span>#{node.nodeId}</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>
                      {node.internalAddress}:{node.internalPort}
                    </span>
                    <span style={{ color: '#bbb', marginLeft: 8 }}>v{node.version}</span>
                  </div>
                ))
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={t('服务状态')} size="small">
              {services.length === 0 ? (
                <Alert description={t('暂无服务数据')} type="info" showIcon />
              ) : (
                services.map((svc) => (
                  <div key={`${svc.serviceName}-${svc.dataNodeId}`} style={{ marginBottom: 8 }}>
                    <Tag color={isServiceUp(svc.state) ? 'success' : 'default'}>{svc.state}</Tag>
                    <span>{svc.serviceName}</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>DataNode {svc.dataNodeId}</span>
                  </div>
                ))
              )}
            </Card>
          </Col>
        </Row>

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

export default Dashboard;
