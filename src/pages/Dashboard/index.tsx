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
  DatabaseOutlined,
  ApiOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import { getNodes, getServices, getConnections, getCurrentQueries } from '../../services/metadata';
import type { NodeInfo, ServiceInfo, ConnectionInfo, CurrentQuery } from '../../types/api';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [queries, setQueries] = useState<CurrentQuery[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [nodesData, servicesData, connectionsData, queriesData] = await Promise.all([
        getNodes(),
        getServices(),
        getConnections(),
        getCurrentQueries(),
      ]);
      setNodes(nodesData);
      setServices(servicesData);
      setConnections(connectionsData);
      setQueries(queriesData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
      <Title level={3}>IoTDB 仪表盘</Title>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="节点数量"
                value={nodes.length}
                prefix={<ClusterOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="服务状态"
                value={services.length}
                prefix={<ApiOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="当前连接"
                value={connections.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="运行中查询"
                value={queries.length}
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="节点概览" size="small">
              {nodes.length === 0 ? (
                <Alert description="暂无节点数据" type="info" showIcon />
              ) : (
                nodes.map((node) => (
                  <div key={node.nodeId} style={{ marginBottom: 8 }}>
                    <Tag color={node.status === 'Running' ? 'success' : 'error'}>
                      {node.nodeType}
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
            <Card title="服务状态" size="small">
              {services.length === 0 ? (
                <Alert description="暂无服务数据" type="info" showIcon />
              ) : (
                services.map((svc, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <Tag color={serviceStatusColor(svc.status)}>
                      {svc.status}
                    </Tag>
                    <span>{svc.serviceType}</span>
                  </div>
                ))
              )}
            </Card>
          </Col>
        </Row>

        <Card title="运行中查询" size="small" style={{ marginTop: 24 }}>
          {queries.length === 0 ? (
            <Alert description="暂无运行中查询" type="info" showIcon />
          ) : (
            <Table
              dataSource={queries.map((q) => ({ ...q, key: q.queryId }))}
              columns={columns}
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
