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
import { ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';

interface QueryInfo {
  queryId: string;
  sql: string;
  startTime: number;
  elapsedTime: number;
  status?: string;
}

const QueryCenter: React.FC = () => {
  const [queries, setQueries] = useState<QueryInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW QUERIES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setQueries(
        values.map((row) => ({
          queryId: row[0],
          sql: row[1],
          startTime: row[2],
          elapsedTime: row[3],
        }))
      );
    } catch (error) {
      message.error('获取查询列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
    const interval = setInterval(fetchQueries, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStopQuery = async (queryId: string) => {
    try {
      await nonQuery(`STOP QUERY ${queryId}`);
      message.success('查询已停止');
      fetchQueries();
    } catch (error: any) {
      message.error(`停止失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: 'Query ID', dataIndex: 'queryId', key: 'queryId' },
    { title: 'SQL', dataIndex: 'sql', key: 'sql', ellipsis: true, width: '40%' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '耗时 (ms)', dataIndex: 'elapsedTime', key: 'elapsedTime' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: QueryInfo) => (
        <Button
          type="link"
          danger
          icon={<StopOutlined />}
          onClick={() => handleStopQuery(record.queryId)}
        >
          停止
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="查询中心"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchQueries}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {queries.length === 0 ? (
            <Alert description="暂无运行中查询" type="info" showIcon />
          ) : (
            <Table
              dataSource={queries.map((q) => ({ ...q, key: q.queryId }))}
              columns={columns}
              size="small"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default QueryCenter;
