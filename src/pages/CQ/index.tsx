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

interface CqInfo {
  cqName: string;
  database: string;
  sql: string;
  status?: string;
}

const CqManagement: React.FC = () => {
  const [cqs, setCqs] = useState<CqInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchCqs = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW CONTINUOUS QUERIES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setCqs(
        values.map((row) => ({
          cqName: row[0],
          database: row[1] || '',
          sql: row[2] || '',
        }))
      );
    } catch (error) {
      message.error('获取连续查询列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCqs();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const cqSql = `CREATE CONTINUOUS QUERY ${values.name} BEGIN SELECT ${values.select} INTO ${values.into} FROM ${values.from} GROUP BY ${values.groupBy} END`;
      await nonQuery(cqSql);
      message.success('连续查询创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchCqs();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await nonQuery(`DROP CONTINUOUS QUERY ${name}`);
      message.success('连续查询删除成功');
      fetchCqs();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: 'CQ 名称', dataIndex: 'cqName', key: 'cqName' },
    { title: '数据库', dataIndex: 'database', key: 'database' },
    { title: 'SQL', dataIndex: 'sql', key: 'sql', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: CqInfo) => (
        <Popconfirm title="确定删除该连续查询吗？" onConfirm={() => handleDelete(record.cqName)}>
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="连续查询管理"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchCqs}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建 CQ
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={cqs.map((c) => ({ ...c, key: c.cqName }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建连续查询"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="CQ 名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="cq_1" />
          </Form.Item>
          <Form.Item name="database" label="数据库" rules={[{ required: true, message: '请输入数据库' }]}>
            <Input placeholder="root.sg" />
          </Form.Item>
          <Form.Item name="select" label="SELECT 表达式" rules={[{ required: true }]}>
            <Input placeholder="avg(s1)" />
          </Form.Item>
          <Form.Item name="into" label="INTO 目标" rules={[{ required: true }]}>
            <Input placeholder="root.sg.autocreate" />
          </Form.Item>
          <Form.Item name="from" label="FROM 来源" rules={[{ required: true }]}>
            <Input placeholder="root.sg.d1" />
          </Form.Item>
          <Form.Item name="groupBy" label="GROUP BY" rules={[{ required: true }]}>
            <Input placeholder="1m" />
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

export default CqManagement;
