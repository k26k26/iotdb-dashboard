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

const ConfigManagement: React.FC = () => {
  const [configs, setConfigs] = useState<{ key: string; value: string }[]>([]);
  const [variables, setVariables] = useState<{ key: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW CONFIGURATION');
      const values = Array.isArray(result?.values) ? result.values : [];
      setConfigs(values.map((row) => ({ key: row[0], value: String(row[1]) })));
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVariables = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW VARIABLES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setVariables(values.map((row) => ({ key: row[0], value: String(row[1]) })));
    } catch (error) {
      message.error('获取变量失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchVariables();
  }, []);

  return (
    <div>
      <Card
        title="系统配置"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => { fetchConfigs(); fetchVariables(); }}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {configs.length === 0 ? (
            <Alert description="暂无配置信息" type="info" showIcon />
          ) : (
            <Table
              dataSource={configs}
              columns={[
                { title: 'Key', dataIndex: 'key', key: 'key' },
                { title: 'Value', dataIndex: 'value', key: 'value' },
              ]}
              size="small"
              pagination={false}
            />
          )}
        </Spin>
      </Card>

      <Card title="系统变量" size="small" style={{ marginTop: 24 }}>
        <Spin spinning={loading}>
          {variables.length === 0 ? (
            <Alert description="暂无变量信息" type="info" showIcon />
          ) : (
            <Table
              dataSource={variables}
              columns={[
                { title: 'Key', dataIndex: 'key', key: 'key' },
                { title: 'Value', dataIndex: 'value', key: 'value' },
              ]}
              size="small"
              pagination={false}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ConfigManagement;
