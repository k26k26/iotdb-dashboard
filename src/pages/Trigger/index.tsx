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
import { App as AntdApp, Card, Table, Button, Space, Spin, Modal, Form, Input, Select, Popconfirm, Alert, Tag } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { queryRows, nonQuery } from '../../services/rest';
import type { TriggerInfo } from '../../types/api';

const quote = (value: string) => `'${value.replace(/'/g, "''")}'`;

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PATH = /^[A-Za-z0-9_.]+$/;

/** TTriggerState in confignode.thrift. */
const stateColor = (state: string): string =>
  ({ ACTIVE: 'success', INACTIVE: 'default', DROPPING: 'warning', TRANSFERRING: 'processing' })[state] ??
  'default';

/** `CREATE TRIGGER` requires the type even though the grammar marks it optional. */
interface TriggerForm {
  triggerName: string;
  triggerType: string;
  event: string;
  pathPattern: string;
  className: string;
  jarUri?: string;
}

const TriggerManagement: React.FC = () => {
  const [triggers, setTriggers] = useState<TriggerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();

  const fetchTriggers = async () => {
    setLoading(true);
    try {
      const rows = await queryRows('SHOW TRIGGERS');
      setTriggers(
        rows.map((row) => ({
          triggerName: String(row.TriggerName ?? ''),
          event: String(row.Event ?? ''),
          type: String(row.Type ?? ''),
          state: String(row.State ?? ''),
          pathPattern: String(row.PathPattern ?? ''),
          className: String(row.ClassName ?? ''),
          nodeId: String(row.NodeID ?? ''),
        }))
      );
      setError('');
    } catch (err: any) {
      setError(`获取触发器列表失败: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriggers();
  }, []);

  /** `WITH (…)` attributes are still left out; only the jar URI is exposed. */
  const handleCreate = async (values: TriggerForm) => {
    const { triggerName, triggerType, event, pathPattern, className, jarUri } = values;
    const uri = jarUri?.trim() ? ` USING URI ${quote(jarUri.trim())}` : '';
    try {
      await nonQuery(
        `CREATE ${triggerType} TRIGGER ${triggerName} ${event} ON ${pathPattern} AS ${quote(className)}${uri}`
      );
      message.success('触发器创建成功');
      setCreateError('');
      setModalOpen(false);
      form.resetFields();
      fetchTriggers();
    } catch (err: any) {
      const detail = err.response?.data?.message || err.message;
      // A trigger is almost always refused server-side (class or jar missing); a toast that
      // disappears in three seconds leaves the table looking broken rather than empty.
      setCreateError(detail);
      message.error(`创建失败: ${detail}`);
    }
  };

  const handleDelete = async (triggerName: string) => {
    try {
      await nonQuery(`DROP TRIGGER ${triggerName}`);
      message.success('触发器删除成功');
      fetchTriggers();
    } catch (err: any) {
      message.error(`删除失败: ${err.response?.data?.message || err.message}`);
    }
  };

  const columns = [
    { title: '触发器名', dataIndex: 'triggerName', key: 'triggerName' },
    { title: '事件', dataIndex: 'event', key: 'event' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    {
      title: '状态',
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => <Tag color={stateColor(state)}>{state}</Tag>,
    },
    { title: '路径', dataIndex: 'pathPattern', key: 'pathPattern', ellipsis: true },
    { title: '实现类', dataIndex: 'className', key: 'className', ellipsis: true },
    { title: '节点', dataIndex: 'nodeId', key: 'nodeId' },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: TriggerInfo) => (
        <Popconfirm title="确定删除该触发器吗？" onConfirm={() => handleDelete(record.triggerName)}>
          <Button type="link" danger>
            删除
          </Button>
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
          {error ? (
            <Alert type="error" showIcon title={error} />
          ) : (
            <Table
              dataSource={triggers}
              rowKey="triggerName"
              columns={columns}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
              locale={{
                emptyText: (
                  <Alert
                    type="info"
                    showIcon
                    title="暂无触发器"
                    description="查询成功，当前集群没有触发器。触发器是 DataNode 加载的 Java 类：要么把 jar 放进 DataNode 的触发器目录再创建，要么在下方「JAR 地址」里给出 URI —— 本机 trusted_uri_pattern 为 file:.*，只接受 DataNode 本地路径。本机也不支持 START / STOP TRIGGER，改配置只能删除后重建。"
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="创建触发器"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setCreateError('');
        }}
        footer={null}
      >
        {createError && (
          <Alert
            type="error"
            showIcon
            title="服务端拒绝了这条 CREATE 语句"
            description={createError}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ triggerType: 'STATELESS', event: 'AFTER INSERT' }}
        >
          <Form.Item
            name="triggerName"
            label="触发器名"
            rules={[
              { required: true, message: '请输入触发器名' },
              { pattern: NAME, message: '仅限字母、数字和下划线，且不能以数字开头' },
            ]}
          >
            <Input placeholder="trigger_1" />
          </Form.Item>
          <Form.Item name="triggerType" label="类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="STATELESS">STATELESS</Select.Option>
              <Select.Option value="STATEFUL">STATEFUL</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="event"
            label="事件"
            rules={[{ required: true }]}
            extra="本版本仅支持插入事件，DELETE 事件会被服务端拒绝。"
          >
            <Select>
              {['BEFORE INSERT', 'AFTER INSERT'].map((event) => (
                <Select.Option key={event} value={event}>
                  {event}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="pathPattern"
            label="路径"
            rules={[
              { required: true, message: '请输入路径' },
              { pattern: PATH, message: '仅允许字母、数字、下划线和点，例如 root.sg.d1' },
            ]}
          >
            <Input placeholder="root.sg.d1" />
          </Form.Item>
          <Form.Item
            name="className"
            label="实现类"
            extra="触发器由 DataNode 加载的 Java 类实现，不是 SQL 语句。"
            rules={[{ required: true, message: '请输入触发器类的全限定名' }]}
          >
            <Input placeholder="org.example.trigger.MyTrigger" />
          </Form.Item>
          <Form.Item
            name="jarUri"
            label="JAR 地址"
            extra="留空则由 DataNode 自行加载已放置的类；本机只信任 file: 前缀，所以填 DataNode 上的绝对路径，例如 file:/data/trigger/my.jar。"
          >
            <Input placeholder="file:/data/trigger/my.jar" />
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
