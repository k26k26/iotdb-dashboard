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
import { Card, Table, Button, message, Spin, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';

const RealTimeMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<{ name: string; value: number; timestamp: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW METRICS');
      const values = Array.isArray(result?.values) ? result.values : [];
      setMetrics(
        values.map((row) => ({
          name: row[0],
          value: Number(row[1]),
          timestamp: Date.now(),
        }))
      );
    } catch (error) {
      message.error('获取监控指标失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { title: '指标名', dataIndex: 'name', key: 'name' },
    { title: '数值', dataIndex: 'value', key: 'value' },
    { title: '更新时间', dataIndex: 'timestamp', key: 'timestamp', render: (ts: number) => new Date(ts).toLocaleTimeString() },
  ];

  return (
    <div>
      <Card
        title="实时监控"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchMetrics}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {metrics.length === 0 ? (
            <Alert description="暂无监控数据" type="info" showIcon />
          ) : (
            <Table
              dataSource={metrics.map((m) => ({ ...m, key: m.name }))}
              columns={columns}
              size="small"
              pagination={false}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default RealTimeMonitoring;
