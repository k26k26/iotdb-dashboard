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
import { Card, Table, Button, message, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';

interface FunctionInfo {
  functionName: string;
  type?: string;
}

const FunctionManagement: React.FC = () => {
  const [functions, setFunctions] = useState<FunctionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFunctions = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW FUNCTIONS');
      const values = Array.isArray(result?.values) ? result.values : [];
      setFunctions(values.map((row) => ({ functionName: row[0], type: row[1] || '' })));
    } catch (error) {
      message.error('获取函数列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunctions();
  }, []);

  const columns = [
    { title: '函数名', dataIndex: 'functionName', key: 'functionName' },
    { title: '类型', dataIndex: 'type', key: 'type' },
  ];

  return (
    <div>
      <Card
        title="函数管理"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchFunctions}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={functions.map((f) => ({ ...f, key: f.functionName }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default FunctionManagement;
