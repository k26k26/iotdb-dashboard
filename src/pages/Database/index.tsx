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
import { Card, Table, Button, Modal, Form, Input, InputNumber, message, Space, Popconfirm, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';

interface DatabaseInfo {
  database: string;
  schema: string;
  ttl?: number;
}

const DatabaseManagement: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchDatabases = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW DATABASES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setDatabases(
        values.map((row) => ({
          database: row[0],
          schema: row[1] || '',
        }))
      );
    } catch (error) {
      message.error('获取数据库列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(`CREATE DATABASE ${values.name}`);
      if (values.ttl) {
        await nonQuery(`SET TTL ${values.name} TO ${values.ttl}`);
      }
      message.success('数据库创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchDatabases();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (database: string) => {
    try {
      await nonQuery(`DROP DATABASE ${database}`);
      message.success('数据库删除成功');
      fetchDatabases();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: '数据库名', dataIndex: 'database', key: 'database' },
    { title: 'Schema', dataIndex: 'schema', key: 'schema' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DatabaseInfo) => (
        <Space>
          <Popconfirm title="确定删除该数据库吗？" onConfirm={() => handleDelete(record.database)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="数据库管理"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchDatabases}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建数据库
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={databases.map((db) => ({ ...db, key: db.database }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建数据库"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="数据库名" rules={[{ required: true, message: '请输入数据库名' }]}>
            <Input placeholder="root.sg" />
          </Form.Item>
          <Form.Item name="ttl" label="TTL (可选，单位：毫秒)">
            <InputNumber min={0} style={{ width: '100%' }} />
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

export default DatabaseManagement;
