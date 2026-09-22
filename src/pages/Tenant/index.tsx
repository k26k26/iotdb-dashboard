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
import { Card, Table, Button, message, Space, Spin, Modal, Form, Input, InputNumber, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';

interface TenantInfo {
  tenantId: string;
  name: string;
  quota?: number;
  status: string;
}

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW TENANTS');
      const values = Array.isArray(result?.values) ? result.values : [];
      setTenants(
        values.map((row) => ({
          tenantId: row[0],
          name: row[1] || '',
          quota: row[2],
          status: row[3] || 'Active',
        }))
      );
    } catch (error) {
      message.error('获取租户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(`CREATE TENANT ${values.tenantId} WITH NAME='${values.name}'`);
      if (values.quota) {
        await nonQuery(`SET TENANT ${values.tenantId} QUOTA ${values.quota}`);
      }
      message.success('租户创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchTenants();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (tenantId: string) => {
    try {
      await nonQuery(`DROP TENANT ${tenantId}`);
      message.success('租户删除成功');
      fetchTenants();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: '租户 ID', dataIndex: 'tenantId', key: 'tenantId' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '配额', dataIndex: 'quota', key: 'quota' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <span style={{ color: status === 'Active' ? '#52c41a' : '#888' }}>{status}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TenantInfo) => (
        <Space>
          <Popconfirm title="确定删除该租户吗？" onConfirm={() => handleDelete(record.tenantId)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="多租户管理"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTenants}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建租户
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={tenants.map((t) => ({ ...t, key: t.tenantId }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建租户"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="tenantId" label="租户 ID" rules={[{ required: true, message: '请输入租户 ID' }]}>
            <Input placeholder="tenant_1" />
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="Tenant 1" />
          </Form.Item>
          <Form.Item name="quota" label="配额">
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

export default TenantManagement;
