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
import { Card, Table, Button, message, Spin, Alert, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';

interface ServiceInfo {
  serviceType: string;
  status: string;
}

const ExternalServices: React.FC = () => {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW EXTERNAL SERVICES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setServices(
        values.map((row) => ({
          serviceType: row[0],
          status: row[1],
        }))
      );
    } catch (error) {
      message.error('获取外部服务列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: string) => {
    if (status === 'RUNNING' || status === 'Normal') return 'success';
    if (status === 'STOPPED' || status === 'Abnormal') return 'error';
    return 'default';
  };

  const columns = [
    { title: '服务类型', dataIndex: 'serviceType', key: 'serviceType' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
  ];

  return (
    <div>
      <Card
        title="外部服务管理"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchServices}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {services.length === 0 ? (
            <Alert description="暂无外部服务" type="info" showIcon />
          ) : (
            <Table
              dataSource={services.map((s, index) => ({ ...s, key: index }))}
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

export default ExternalServices;
