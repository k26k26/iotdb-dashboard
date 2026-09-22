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
import { Card, Table, Button, message, Space, Spin, Tag, Modal, Form, Input, InputNumber, Select, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';

interface AlertRule {
  ruleId: string;
  name: string;
  metric: string;
  threshold: number;
  condition: string;
  enabled: boolean;
}

const AlertManagement: React.FC = () => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchRules = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW ALERT RULES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setRules(
        values.map((row) => ({
          ruleId: row[0],
          name: row[1] || '',
          metric: row[2] || '',
          threshold: row[3],
          condition: row[4] || '',
          enabled: row[5] !== false,
        }))
      );
    } catch (error) {
      message.error('获取告警规则失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(
        `CREATE ALERT RULE ${values.name} ON ${values.metric} WITH (THRESHOLD=${values.threshold}, CONDITION='${values.condition}')`
      );
      message.success('告警规则创建成功');
      setModalOpen(false);
      form.resetFields();
      fetchRules();
    } catch (error: any) {
      message.error(`创建失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      await nonQuery(`DROP ALERT RULE ${ruleId}`);
      message.success('告警规则删除成功');
      fetchRules();
    } catch (error: any) {
      message.error(`删除失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const columns = [
    { title: '规则 ID', dataIndex: 'ruleId', key: 'ruleId' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '指标', dataIndex: 'metric', key: 'metric' },
    { title: '阈值', dataIndex: 'threshold', key: 'threshold' },
    { title: '条件', dataIndex: 'condition', key: 'condition' },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => <Tag color={enabled ? 'success' : 'default'}>{enabled ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: AlertRule) => (
        <Space>
          <Popconfirm title="确定删除该告警规则吗？" onConfirm={() => handleDelete(record.ruleId)}>
            <Button type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
          <Table
            dataSource={rules.map((r) => ({ ...r, key: r.ruleId }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="创建告警规则"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="规则名" rules={[{ required: true, message: '请输入规则名' }]}>
            <Input placeholder="alert_rule_1" />
          </Form.Item>
          <Form.Item name="metric" label="指标" rules={[{ required: true, message: '请输入指标' }]}>
            <Input placeholder="root.sg.d1.s1" />
          </Form.Item>
          <Form.Item name="threshold" label="阈值" rules={[{ required: true, message: '请输入阈值' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="condition" label="条件" rules={[{ required: true }]}>
            <Select defaultValue="GREATER_THAN">
              <Select.Option value="GREATER_THAN">大于</Select.Option>
              <Select.Option value="LESS_THAN">小于</Select.Option>
              <Select.Option value="EQUALS">等于</Select.Option>
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

export default AlertManagement;
