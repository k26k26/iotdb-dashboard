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

interface UserInfo {
  username: string;
  role?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await query('LIST USERS');
      const values = Array.isArray(result?.values) ? result.values : [];
      setUsers(values.map((row) => ({ username: row[0] })));
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(`CREATE USER ${values.username} WITH PASSWORD '${values.password}'`);
      if (values.role) {
        await nonQuery(`GRANT ${values.role} TO ${values.username}`);
      }
      message.success('用户创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (username: string) => {
    try {
      await nonQuery(`DROP USER ${username}`);
      message.success('用户删除成功');
      fetchUsers();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserInfo) => (
        <Space>
          <Popconfirm title="确定删除该用户吗？" onConfirm={() => handleDelete(record.username)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="用户管理"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建用户
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={users.map((u) => ({ ...u, key: u.username }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建用户"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="root" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="******" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select allowClear placeholder="请选择角色">
              <Select.Option value="ROOT">ROOT</Select.Option>
              <Select.Option value="ADMIN">ADMIN</Select.Option>
              <Select.Option value="USER">USER</Select.Option>
            </Select>
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

export default UserManagement;
