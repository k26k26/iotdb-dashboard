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
import { Card, Table, Button, message, Space, Spin, Modal, Form, Input, Select, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';

interface TriggerInfo {
  triggerName: string;
  database: string;
  status: string;
  type?: string;
}

const TriggerManagement: React.FC = () => {
  const [triggers, setTriggers] = useState<TriggerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW TRIGGERS');
      const values = Array.isArray(result?.values) ? result.values : [];
      setTriggers(
        values.map((row) => ({
          triggerName: row[0],
          database: row[1] || '',
          status: row[2] || '',
          type: row[3] || '',
        }))
      );
    } catch (error) {
      message.error('获取触发器列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(
        `CREATE TRIGGER ${values.name} WITH (TYPE='${values.type}') ON (${values.path}) AS ${values.statement}`
      );
      message.success('触发器创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchTriggers();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await nonQuery(`DROP TRIGGER ${name}`);
      message.success('触发器删除成功');
      fetchTriggers();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: '触发器名', dataIndex: 'triggerName', key: 'triggerName' },
    { title: '数据库', dataIndex: 'database', key: 'database' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <span style={{ color: status === 'ACTIVE' ? '#52c41a' : '#888' }}>{status}</span>,
    },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TriggerInfo) => (
        <Popconfirm title="确定删除该触发器吗？" onConfirm={() => handleDelete(record.triggerName)}>
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="触发器管理"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTriggers}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建触发器
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={triggers.map((t) => ({ ...t, key: t.triggerName }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建触发器"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="触发器名" rules={[{ required: true, message: '请输入触发器名' }]}>
            <Input placeholder="trigger_1" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select defaultValue="TML">
              <Select.Option value="TML">TML</Select.Option>
              <Select.Option value="SQL">SQL</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入路径' }]}>
            <Input placeholder="root.sg.d1" />
          </Form.Item>
          <Form.Item name="statement" label="SQL 语句" rules={[{ required: true, message: '请输入 SQL' }]}>
            <Input.TextArea rows={3} placeholder="INSERT INTO root.sg.d1(timestamp, s1) VALUES (NOW(), 1)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TriggerManagement;
