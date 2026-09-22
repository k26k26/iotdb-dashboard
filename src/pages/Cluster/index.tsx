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

import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Alert, Tag, Table, Typography } from 'antd';
import {
  ClusterOutlined,
  ApiOutlined,
  DatabaseOutlined,
  WifiOutlined,
} from '@ant-design/icons';
import { getNodes, getDataNodes, getConfigNodes, getServices, getConnections, getCurrentQueries } from '../../services/metadata';
import type { NodeInfo, ServiceInfo, ConnectionInfo, CurrentQuery } from '../../types/api';

const { Title } = Typography;

const ClusterManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [dataNodes, setDataNodes] = useState<NodeInfo[]>([]);
  const [configNodes, setConfigNodes] = useState<NodeInfo[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [queries, setQueries] = useState<CurrentQuery[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nodesData, dataNodesData, configNodesData, servicesData, connectionsData, queriesData] = await Promise.all([
        getNodes(),
        getDataNodes(),
        getConfigNodes(),
        getServices(),
        getConnections(),
        getCurrentQueries(),
      ]);
      setNodes(nodesData);
      setDataNodes(dataNodesData);
      setConfigNodes(configNodesData);
      setServices(servicesData);
      setConnections(connectionsData);
      setQueries(queriesData);
    } catch (error) {
      console.error('Failed to fetch cluster data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const serviceStatusColor = (status: string) => {
    if (status === 'Running' || status === 'Normal') return 'success';
    if (status === 'Stopped' || status === 'Abnormal') return 'error';
    return 'default';
  };

  const columns = [
    { title: 'Query ID', dataIndex: 'queryId', key: 'queryId' },
    { title: 'SQL', dataIndex: 'sql', key: 'sql', ellipsis: true },
    { title: 'Start Time', dataIndex: 'startTime', key: 'startTime' },
    { title: 'Elapsed (ms)', dataIndex: 'elapsedTime', key: 'elapsedTime' },
  ];

  return (
    <div>
      <Title level={3}>集群管理</Title>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="总节点数"
                value={nodes.length}
                prefix={<ClusterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="数据节点"
                value={dataNodes.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="配置节点"
                value={configNodes.length}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="当前连接"
                value={connections.length}
                prefix={<WifiOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="数据节点" size="small">
              {dataNodes.length === 0 ? (
                <Alert description="暂无数据节点" type="info" showIcon />
              ) : (
                dataNodes.map((node) => (
                  <div key={node.nodeId} style={{ marginBottom: 8 }}>
                    <Tag color={node.status === 'Running' ? 'success' : 'error'}>
                      {node.status}
                    </Tag>
                    <span>{node.nodeId}</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>
                      {node.internalAddress}:{node.internalPort}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="配置节点" size="small">
              {configNodes.length === 0 ? (
                <Alert description="暂无配置节点" type="info" showIcon />
              ) : (
                configNodes.map((node) => (
                  <div key={node.nodeId} style={{ marginBottom: 8 }}>
                    <Tag color={node.status === 'Running' ? 'success' : 'error'}>
                      {node.status}
                    </Tag>
                    <span>{node.nodeId}</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>
                      {node.internalAddress}:{node.internalPort}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </Col>
        </Row>

        <Card title="服务状态" size="small" style={{ marginTop: 24 }}>
          {services.length === 0 ? (
            <Alert description="暂无服务数据" type="info" showIcon />
          ) : (
            <Table
              dataSource={services.map((svc, index) => ({ ...svc, key: index }))}
              columns={[
                { title: '服务类型', dataIndex: 'serviceType', key: 'serviceType' },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={serviceStatusColor(status)}>{status}</Tag>
                  ),
                },
              ]}
              size="small"
              pagination={false}
            />
          )}
        </Card>

        <Card title="运行中查询" size="small" style={{ marginTop: 24 }}>
          {queries.length === 0 ? (
            <Alert description="暂无运行中查询" type="info" showIcon />
          ) : (
            <Table
              dataSource={queries.map((q) => ({ ...q, key: q.queryId }))}
              columns={columns}
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default ClusterManagement;
