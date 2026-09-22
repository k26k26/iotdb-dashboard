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
import { App as AntdApp, Alert, Button, Card, Spin, Table } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getConfigurations } from '../../services/metadata';
import type { ConfigInfo } from '../../types/api';

const describe = (err: any): string => err.response?.data?.message || err.message || '请求失败';

const ConfigManagement: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { message } = AntdApp.useApp();

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      setConfigs(await getConfigurations());
      setError('');
    } catch (err: any) {
      setConfigs([]);
      const detail = describe(err);
      setError(detail);
      message.error(`获取配置失败: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return (
    <div>
      <Card
        title="系统配置"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title="无法读取集群参数" description={error} />
          ) : (
            <Table
              dataSource={configs}
              rowKey="variable"
              columns={[
                { title: '参数名', dataIndex: 'variable', key: 'variable', width: 320 },
                { title: '参数值', dataIndex: 'value', key: 'value' },
              ]}
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{
                emptyText: <Alert type="info" showIcon title="集群没有返回任何参数" description="查询成功，但 information_schema.configurations 是空表。" />,
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ConfigManagement;
