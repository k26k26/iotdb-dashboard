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
import { Card, Table, Button, message, Space, Spin, Modal, Form, Input, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';

interface IndexInfo {
  indexName: string;
  database: string;
  type?: string;
}

const IndexManagement: React.FC = () => {
  const [indexes, setIndexes] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchIndexes = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW INDEX');
      const values = Array.isArray(result?.values) ? result.values : [];
      setIndexes(
        values.map((row) => ({
          indexName: row[0],
          database: row[1] || '',
          type: row[2] || '',
        }))
      );
    } catch (error) {
      message.error('获取索引列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexes();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(`CREATE INDEX ${values.name} ON ${values.path} (${values.column})`);
      message.success('索引创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchIndexes();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await nonQuery(`DROP INDEX ${name}`);
      message.success('索引删除成功');
      fetchIndexes();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: '索引名', dataIndex: 'indexName', key: 'indexName' },
    { title: '数据库', dataIndex: 'database', key: 'database' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: IndexInfo) => (
        <Popconfirm title="确定删除该索引吗？" onConfirm={() => handleDelete(record.indexName)}>
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="索引管理"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchIndexes}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建索引
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={indexes.map((i) => ({ ...i, key: i.indexName }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建索引"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="索引名" rules={[{ required: true, message: '请输入索引名' }]}>
            <Input placeholder="idx_s1" />
          </Form.Item>
          <Form.Item name="path" label="路径" rules={[{ required: true, message: '请输入路径' }]}>
            <Input placeholder="root.sg.d1" />
          </Form.Item>
          <Form.Item name="column" label="列名" rules={[{ required: true, message: '请输入列名' }]}>
            <Input placeholder="s1" />
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

export default IndexManagement;
