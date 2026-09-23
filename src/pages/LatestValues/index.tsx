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
import { App as AntdApp, Card, Row, Col, Spin, Alert, Button, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { fastLastQuery } from '../../services/rest';
import { useI18n } from '../../i18n';

const { Text } = Typography;

interface LatestValue {
  path: string;
  value: number | string;
  timestamp?: number;
}

const LatestValues: React.FC = () => {
  const [values, setValues] = useState<LatestValue[]>([]);
  const [loading, setLoading] = useState(false);
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const data = await fastLastQuery(['root']);
      // fastLastQuery is column-oriented too: one array per entry of `expressions`
      // (Timeseries / Value / DataType), with every row's time in `timestamps`.
      const names = Array.isArray(data?.expressions) ? data.expressions : [];
      const table = Array.isArray(data?.values) ? data.values : [];
      const times = Array.isArray(data?.timestamps) ? data.timestamps : [];
      const columnOf = (name: string): any[] => {
        const index = names.indexOf(name);
        return index >= 0 && Array.isArray(table[index]) ? table[index] : [];
      };
      const paths = columnOf('Timeseries');
      const latest = columnOf('Value');
      setValues(
        paths.map((path, i) => ({
          path: String(path),
          value: latest[i] ?? '',
          timestamp: typeof times[i] === 'number' ? times[i] : undefined,
        }))
      );
    } catch (error: any) {
      message.error(t('获取最新值失败: {msg}', { msg: error.response?.data?.message || error.message }));
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
        title={t('最新值面板')}
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchLatest}>
            {t('刷新')}
          </Button>
        }
      >
        <Spin spinning={loading}>
          {values.length === 0 ? (
            <Alert description={t('暂无最新值数据')} type="info" showIcon />
          ) : (
            <Row gutter={[16, 16]}>
              {values.map((item) => (
                <Col xs={24} sm={12} lg={8} key={item.path}>
                  <Card size="small" type="inner">
                    {/* Paths are device-length (root.<db>.<tenant>.<item>.<measurement>) and far
                        wider than a third-column card. Ellipsis would cut every card at the same
                        offset and hide the tail that tells them apart, so wrap instead. */}
                    <Text type="secondary" style={{ display: 'block', wordBreak: 'break-all' }}>
                      {item.path}
                    </Text>
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
