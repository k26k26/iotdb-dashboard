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

interface PipeInfo {
  pipeName: string;
  pipeId: string;
  status: string;
  sourceDatabase: string;
  sinkDatabase: string;
}

const PipeManagement: React.FC = () => {
  const [pipes, setPipes] = useState<PipeInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPipes = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW PIPES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setPipes(
        values.map((row) => ({
          pipeName: row[0],
          pipeId: row[1],
          status: row[2],
          sourceDatabase: row[3] || '',
          sinkDatabase: row[4] || '',
        }))
      );
    } catch (error) {
      message.error('获取 Pipe 列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipes();
    const interval = setInterval(fetchPipes, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: string) => {
    if (status === 'RUNNING') return 'success';
    if (status === 'STOPPED') return 'error';
    return 'default';
  };

  const columns = [
    { title: 'Pipe 名称', dataIndex: 'pipeName', key: 'pipeName' },
    { title: 'Pipe ID', dataIndex: 'pipeId', key: 'pipeId' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusColor(status)}>{status}</Tag>,
    },
    { title: '源数据库', dataIndex: 'sourceDatabase', key: 'sourceDatabase' },
    { title: '目标数据库', dataIndex: 'sinkDatabase', key: 'sinkDatabase' },
  ];

  return (
    <div>
      <Card
        title="数据管道管理"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchPipes}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {pipes.length === 0 ? (
            <Alert description="暂无 Pipe" type="info" showIcon />
          ) : (
            <Table
              dataSource={pipes.map((p) => ({ ...p, key: p.pipeId }))}
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

export default PipeManagement;
