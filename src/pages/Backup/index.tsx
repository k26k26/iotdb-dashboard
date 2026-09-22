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
import { Card, Table, Button, message, Space, Spin, Alert, Tag, Modal, Form, Input } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';

interface BackupTask {
  taskId: string;
  database: string;
  status: string;
  startTime: number;
  endTime?: number;
}

const BackupRecovery: React.FC = () => {
  const [tasks, setTasks] = useState<BackupTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW BACKUP TASKS');
      const values = Array.isArray(result?.values) ? result.values : [];
      setTasks(
        values.map((row) => ({
          taskId: row[0],
          database: row[1] || '',
          status: row[2] || '',
          startTime: row[3],
          endTime: row[4],
        }))
      );
    } catch (error) {
      message.error('获取备份任务失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(`BACKUP DATABASE ${values.database} TO '${values.path}'`);
      message.success('备份任务创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchTasks();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRestore = async (taskId: string) => {
    try {
      await nonQuery(`RESTORE DATABASE FROM BACKUP ${taskId}`);
      message.success('恢复任务启动成功');
      fetchTasks();
    } catch (error: any) {
      message.error(`恢复失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: '任务 ID', dataIndex: 'taskId', key: 'taskId' },
    { title: '数据库', dataIndex: 'database', key: 'database' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'COMPLETED' ? 'success' : 'processing'}>{status}</Tag>,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (ts: number) => new Date(ts).toLocaleString(),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (ts?: number) => (ts ? new Date(ts).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: BackupTask) => (
        <Button type="link" onClick={() => handleRestore(record.taskId)}>
          恢复
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="备份恢复"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTasks}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              新建备份
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {tasks.length === 0 ? (
            <Alert description="暂无备份任务" type="info" showIcon />
          ) : (
            <Table
              dataSource={tasks}
              columns={columns}
              size="small"
              pagination={{ pageSize: 20 }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="新建备份"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="database" label="数据库" rules={[{ required: true, message: '请输入数据库名' }]}>
            <Input placeholder="root.sg" />
          </Form.Item>
          <Form.Item name="path" label="备份路径" rules={[{ required: true, message: '请输入备份路径' }]}>
            <Input placeholder="file:///backup/iotdb" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建备份
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BackupRecovery;
