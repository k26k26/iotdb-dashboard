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
import { Card, Row, Col, Spin, Alert, Button, message, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { fastLastQuery } from '../../services/rest';

const { Text } = Typography;

interface LatestValue {
  path: string;
  value: number | string;
  timestamp?: number;
}

const LatestValues: React.FC = () => {
  const [values, setValues] = useState<LatestValue[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const data = await fastLastQuery(['root']);
      const rawValues = Array.isArray(data?.values) ? data.values : [];
      const mapped: LatestValue[] = rawValues.map((row: any) => ({
        path: row[0],
        value: row[1],
        timestamp: row[2],
      }));
      setValues(mapped);
    } catch (error) {
      message.error('获取最新值失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <Card
        title="最新值面板"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchLatest}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {values.length === 0 ? (
            <Alert description="暂无最新值数据" type="info" showIcon />
          ) : (
            <Row gutter={[16, 16]}>
              {values.map((item) => (
                <Col xs={24} sm={12} lg={8} key={item.path}>
                  <Card size="small" type="inner">
                    <Text type="secondary">{item.path}</Text>
                    <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>
                      {item.value}
                    </div>
                    {item.timestamp !== undefined && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default LatestValues;
