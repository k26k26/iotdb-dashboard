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
import { Card, Table, Button, message, Spin, Alert, Tag, Statistic, Row, Col, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';

const { Title } = Typography;

interface ClusterHealth {
  nodeId: string;
  status: string;
  role: string;
  uptime: number;
  lastHeartbeat: number;
}

const HighAvailability: React.FC = () => {
  const [health, setHealth] = useState<ClusterHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW CLUSTER');
      const values = Array.isArray(result?.values) ? result.values : [];
      const mapped: ClusterHealth[] = values.map((row) => ({
        nodeId: row[0],
        status: row[1] || 'Unknown',
        role: row[2] || '',
        uptime: row[3] || 0,
        lastHeartbeat: row[4] || Date.now(),
      }));
      setHealth(mapped);
      const healthyCount = mapped.filter((h) => h.status === 'Running' || h.status === 'Normal').length;
      setScore(mapped.length > 0 ? Math.round((healthyCount / mapped.length) * 100) : 0);
    } catch (error) {
      message.error('获取集群健康状态失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { title: '节点 ID', dataIndex: 'nodeId', key: 'nodeId' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'Running' || status === 'Normal' ? 'success' : 'error'}>{status}</Tag>,
    },
    { title: '角色', dataIndex: 'role', key: 'role' },
    {
      title: '运行时间',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: number) => `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      render: (ts: number) => new Date(ts).toLocaleTimeString(),
    },
  ];

  return (
    <div>
      <Title level={3}>高可用监控</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="集群健康度" value={score} suffix="%" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="节点总数" value={health.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="健康节点" value={health.filter((h) => h.status === 'Running' || h.status === 'Normal').length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="异常节点" value={health.filter((h) => h.status !== 'Running' && h.status !== 'Normal').length} />
          </Card>
        </Col>
      </Row>

      <Card
        title="节点详情"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchHealth}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {health.length === 0 ? (
            <Alert description="暂无集群数据" type="info" showIcon />
          ) : (
            <Table
              dataSource={health}
              columns={columns}
              size="small"
              pagination={{ pageSize: 20 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default HighAvailability;
