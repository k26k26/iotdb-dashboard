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
import { Card, Table, Button, message, Space, Spin, Alert, Tag, Input } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';

interface AuditLog {
  logId: string;
  userId: string;
  operation: string;
  target: string;
  timestamp: number;
  status: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const sql = filter ? `SELECT * FROM audit_logs WHERE user_id='${filter}' OR operation='${filter}'` : 'SELECT * FROM audit_logs';
      const result = await query(sql);
      const values = Array.isArray(result?.values) ? result.values : [];
      setLogs(
        values.map((row) => ({
          logId: row[0],
          userId: row[1],
          operation: row[2],
          target: row[3],
          timestamp: row[4],
          status: row[5],
        }))
      );
    } catch (error) {
      message.error('获取审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const exportAudit = () => {
    const headers = 'Log ID,User,Operation,Target,Timestamp,Status';
    const rows = logs.map((l) => `${l.logId},${l.userId},${l.operation},${l.target},${l.timestamp},${l.status}`);
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${Date.now()}.csv`;
    link.click();
    message.success('审计日志导出成功');
  };

  const columns = [
    { title: 'Log ID', dataIndex: 'logId', key: 'logId' },
    { title: '用户', dataIndex: 'userId', key: 'userId' },
    { title: '操作', dataIndex: 'operation', key: 'operation' },
    { title: '目标', dataIndex: 'target', key: 'target' },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts: number) => new Date(ts).toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'SUCCESS' ? 'success' : 'error'}>{status}</Tag>,
    },
  ];

  return (
    <div>
      <Card
        title="审计日志"
        size="small"
        extra={
          <Space>
            <Input
              placeholder="过滤用户或操作"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onPressEnter={fetchLogs}
              style={{ width: 200 }}
            />
            <Button icon={<SearchOutlined />} onClick={fetchLogs}>
              搜索
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
              刷新
            </Button>
            <Button onClick={exportAudit}>导出</Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {logs.length === 0 ? (
            <Alert description="暂无审计日志" type="info" showIcon />
          ) : (
            <Table
              dataSource={logs}
              columns={columns}
              size="small"
              pagination={{ pageSize: 20 }}
              scroll={{ x: 'max-content' }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default AuditLogs;
