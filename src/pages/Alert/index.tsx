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

import React, { useState } from 'react';
import { App as AntdApp, Alert, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Spin, Table } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { nonQuery, queryRows } from '../../services/rest';

/** Rule and metric names are interpolated raw, so keep them to identifier/path characters. */
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PATH = /^[A-Za-z0-9_.]+$/;

const describe = (err: any): string => err.response?.data?.message || err.message || '请求失败';

/**
 * Neither parser has an ALERT token, so every statement this page can send is refused with
 * `code 700 no viable alternative`. Nothing is fetched on mount -- that would spend the page's first
 * paint on a guaranteed error -- and the refusal is shown verbatim whenever the user asks for it.
 */
const unsupported = (
  <Alert
    type="warning"
    showIcon
    title="本版本 IoTDB 没有告警规则功能"
    description={
      <div>
        <p>
          tree 与 relational 两个 SQL 解析器的语法里都没有 ALERT 关键字：<code>SHOW ALERT RULES</code>、
          <code>CREATE ALERT RULE …</code>、<code>DROP ALERT RULE …</code> 都会以 <code>code 700</code>{' '}
          被拒，<code>information_schema.alerts</code> 也不存在。
        </p>
        <p>点「刷新」可以看服务端的原始拒绝信息；上游一旦实现告警语句，这张表会按它给的列直接显示。</p>
      </div>
    }
  />
);

interface AlertForm {
  name: string;
  metric: string;
  threshold: number;
  condition: string;
}

/** The statement the page would send if the server accepted it -- kept as one function so the wording never drifts. */
const buildCreate = (values: AlertForm): string =>
  `CREATE ALERT RULE ${values.name} ON ${values.metric} WITH (THRESHOLD=${values.threshold}, CONDITION='${values.condition}')`;

const AlertManagement: React.FC = () => {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();

  const fetchRules = async () => {
    setLoading(true);
    setAttempted(true);
    try {
      setRows(await queryRows('SHOW ALERT RULES'));
      setError('');
    } catch (err: any) {
      setRows([]);
      setError(describe(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: AlertForm) => {
    try {
      await nonQuery(buildCreate(values));
      message.success('告警规则创建成功');
      setCreateError('');
      setModalOpen(false);
      form.resetFields();
      fetchRules();
    } catch (err: any) {
      const detail = describe(err);
      setCreateError(detail);
      message.error(`创建失败: ${detail}`);
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await nonQuery(`DROP ALERT RULE ${ruleId}`);
      message.success('告警规则删除成功');
      fetchRules();
    } catch (err: any) {
      message.error(`删除失败: ${describe(err)}`);
    }
  };

  // The header row belongs to a statement this server has never answered, so render whatever it sends
  // rather than pinning columns invented from another product.
  const headers = Object.keys(rows[0] ?? {});

  return (
    <div>
      <Card
        title="告警规则管理"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchRules}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建规则
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title="服务端拒绝了这条 SHOW ALERT RULES 语句" description={error} />
          ) : (
            <Table
              dataSource={rows}
              rowKey={(record) => JSON.stringify(record)}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
              columns={[
                ...headers.map((header) => ({ title: header, dataIndex: header, key: header, ellipsis: true })),
                {
                  title: '操作',
                  key: 'action',
                  render: (_: unknown, record: Record<string, any>) => (
                    <Popconfirm
                      title="确定删除该告警规则吗？"
                      onConfirm={() => handleDelete(String(Object.values(record)[0] ?? ''))}
                    >
                      <Button type="link" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
              locale={{ emptyText: attempted ? '服务端返回了空列表' : unsupported }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="创建告警规则"
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
          initialValues={{ condition: 'GREATER_THAN' }}
        >
          <Form.Item
            name="name"
            label="规则名"
            rules={[
              { required: true, message: '请输入规则名' },
              { pattern: NAME, message: '仅限字母、数字和下划线，且不能以数字开头' },
            ]}
          >
            <Input placeholder="alert_rule_1" />
          </Form.Item>
          <Form.Item
            name="metric"
            label="指标路径"
            rules={[
              { required: true, message: '请输入指标路径' },
              { pattern: PATH, message: '仅允许路径字符，例如 root.sg.d1.s1' },
            ]}
          >
            <Input placeholder="root.mtwarn_ts.d1.s1" />
          </Form.Item>
          <Form.Item name="threshold" label="阈值" rules={[{ required: true, message: '请输入阈值' }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="condition"
            label="条件"
            rules={[{ required: true, message: '请选择条件' }]}
            extra="比较符以枚举名送进 CONDITION 属性。"
          >
            <Select
              options={[
                { label: '大于', value: 'GREATER_THAN' },
                { label: '小于', value: 'LESS_THAN' },
                { label: '等于', value: 'EQUALS' },
              ]}
            />
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

export default AlertManagement;
