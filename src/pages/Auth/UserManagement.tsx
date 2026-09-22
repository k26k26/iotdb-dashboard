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
import { App as AntdApp, Card, Table, Button, Space, Spin, Modal, Form, Input, Select, Popconfirm, Alert } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { queryRows, nonQuery } from '../../services/rest';
import type { UserInfo } from '../../types/api';

/** Only the password is a string literal; role and user names are identifiers. */
const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [userRows, roleRows] = await Promise.all([queryRows('LIST USER'), queryRows('LIST ROLE')]);
      setUsers(
        userRows.map(
          (row) =>
            ({ userId: Number(row.UserId), username: String(row.User) }) as UserInfo
        )
      );
      setRoles(roleRows.map((row) => String(row.Role)));
      setError('');
    } catch (err: any) {
      setError(`获取用户列表失败: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(`CREATE USER ${values.username} ${quote(values.password)}`);
      if (values.role) {
        await nonQuery(`GRANT ROLE \`${values.role}\` TO ${values.username}`);
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
    { title: '用户 ID', dataIndex: 'userId', key: 'userId' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: UserInfo) => (
        <Space>
          <Popconfirm title="确定删除该用户吗？" onConfirm={() => handleDelete(record.username)}>
            <Button type="link" danger>
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
          {error ? (
            <Alert type="error" showIcon title={error} />
          ) : (
            <Table
              dataSource={users}
              rowKey="userId"
              columns={columns}
              size="small"
              pagination={{ pageSize: 20 }}
            />
          )}
        </Spin>
      </Card>

      <Modal title="创建用户" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate} initialValues={{ role: undefined }}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              {
                pattern: /^[A-Za-z_][A-Za-z0-9_]*$/,
                message: '仅限字母、数字和下划线，且不能以数字开头',
              },
            ]}
          >
            <Input placeholder="manager_a" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="******" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            extra={roles.length ? undefined : '集群还没有角色，可先执行 CREATE ROLE 再回来授权。'}
          >
            <Select allowClear placeholder="请选择角色">
              {roles.map((role) => (
                <Select.Option key={role} value={role}>
                  {role}
                </Select.Option>
              ))}
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
