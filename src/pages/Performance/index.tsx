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
import { Card, Table, Button, message, Space, Spin, Alert, Tag, Statistic, Row, Col, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';

const { Title, Text } = Typography;

interface SlowQuery {
  queryId: string;
  sql: string;
  elapsedTime: number;
  startTime: number;
  connection: string;
}

interface PerformanceAdvice {
  metric: string;
  advice: string;
  severity: 'high' | 'medium' | 'low';
}

const PerformanceTuning: React.FC = () => {
  const [slowQueries, setSlowQueries] = useState<SlowQuery[]>([]);
  const [advices, setAdvices] = useState<PerformanceAdvice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW SLOW QUERIES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setSlowQueries(
        values.map((row) => ({
          queryId: row[0],
          sql: row[1],
          elapsedTime: row[2],
          startTime: row[3],
          connection: row[4],
        }))
      );

      const adviceResult = await query('SHOW PERFORMANCE ADVICE');
      const adviceValues = Array.isArray(adviceResult?.values) ? adviceResult.values : [];
      setAdvices(
        adviceValues.map((row) => ({
          metric: row[0],
          advice: row[1],
          severity: row[2] || 'medium',
        }))
      );
    } catch (error) {
      message.error('获取性能数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const severityColor = (severity: string) => {
    if (severity === 'high') return 'error';
    if (severity === 'medium') return 'warning';
    return 'default';
  };

  const columns = [
    { title: 'Query ID', dataIndex: 'queryId', key: 'queryId' },
    { title: 'SQL', dataIndex: 'sql', key: 'sql', ellipsis: true },
    { title: '耗时 (ms)', dataIndex: 'elapsedTime', key: 'elapsedTime' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: (ts: number) => new Date(ts).toLocaleString() },
    { title: '连接', dataIndex: 'connection', key: 'connection' },
  ];

  return (
    <div>
      <Title level={3}>性能调优</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="慢查询数" value={slowQueries.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均耗时"
              value={slowQueries.length > 0 ? Math.round(slowQueries.reduce((a, b) => a + b.elapsedTime, 0) / slowQueries.length) : 0}
              suffix="ms"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="优化建议" value={advices.length} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="高优先级" value={advices.filter((a) => a.severity === 'high').length} />
          </Card>
        </Col>
      </Row>

      <Card
        title="慢查询分析"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {slowQueries.length === 0 ? (
            <Alert description="暂无慢查询" type="info" showIcon />
          ) : (
            <Table
              dataSource={slowQueries}
              columns={columns}
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Spin>
      </Card>

      <Card title="优化建议" size="small" style={{ marginTop: 24 }}>
        <Spin spinning={loading}>
          {advices.length === 0 ? (
            <Alert description="暂无优化建议" type="info" showIcon />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              {advices.map((item, index) => (
                <Card key={index} size="small" type="inner">
                  <Text strong>{item.metric}</Text>
                  <Tag color={severityColor(item.severity)} style={{ marginLeft: 8 }}>
                    {item.severity.toUpperCase()}
                  </Tag>
                  <div style={{ marginTop: 8 }}>{item.advice}</div>
                </Card>
              ))}
            </Space>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default PerformanceTuning;
