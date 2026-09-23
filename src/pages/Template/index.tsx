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
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Spin, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery } from '../../services/rest';
import { useI18n } from '../../i18n';

interface TemplateInfo {
  name: string;
  schema?: string;
  encoding?: string;
  compression?: string;
}

const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { t } = useI18n();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW SCHEMA TEMPLATES');
      const values = Array.isArray(result?.values) ? result.values : [];
      setTemplates(
        values.map((row) => ({
          name: row[0],
          schema: row[1] || '',
          encoding: row[2] || '',
          compression: row[3] || '',
        }))
      );
    } catch (error) {
      message.error(t('获取模板列表失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const datatype = values.datatype || 'INT64';
      const encoding = values.encoding || 'RLE';
      const compression = values.compression || 'LZ4';
      await nonQuery(
        `CREATE SCHEMA TEMPLATE ${values.name} (${values.node} WITH DATATYPE=${datatype}, ENCODING=${encoding}, COMPRESSION=${compression})`
      );
      message.success(t('模板创建成功'));
      setModalOpen(false);
      form.resetFields();
      fetchTemplates();
    } catch (error: any) {
      message.error(t('创建失败: {msg}', { msg: error.response?.data?.message || error.message }));
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await nonQuery(`DROP SCHEMA TEMPLATE ${name}`);
      message.success(t('模板删除成功'));
      fetchTemplates();
    } catch (error: any) {
      message.error(t('删除失败: {msg}', { msg: error.response?.data?.message || error.message }));
    }
  };

  const columns = [
    { title: t('模板名'), dataIndex: 'name', key: 'name' },
    { title: 'Schema', dataIndex: 'schema', key: 'schema' },
    { title: t('编码'), dataIndex: 'encoding', key: 'encoding' },
    { title: t('压缩'), dataIndex: 'compression', key: 'compression' },
    {
      title: t('操作'),
      key: 'action',
      render: (_: any, record: TemplateInfo) => (
        <Popconfirm title={t('确定删除该模板吗？')} onConfirm={() => handleDelete(record.name)}>
          <Button type="link" danger icon={<DeleteOutlined />}>
            {t('删除')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('Schema 模板管理')}
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTemplates}>
              {t('刷新')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              {t('创建模板')}
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={templates.map((t) => ({ ...t, key: t.name }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title={t('创建 Schema 模板')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label={t('模板名')} rules={[{ required: true, message: t('请输入模板名') }]}>
            <Input placeholder="template_1" />
          </Form.Item>
          <Form.Item name="node" label={t('节点路径')} rules={[{ required: true, message: t('请输入节点路径') }]}>
            <Input placeholder="root.sg.d1" />
          </Form.Item>
          <Form.Item name="datatype" label={t('数据类型')} rules={[{ required: true }]}>
            <Select defaultValue="INT64">
              <Select.Option value="INT64">INT64</Select.Option>
              <Select.Option value="INT32">INT32</Select.Option>
              <Select.Option value="FLOAT">FLOAT</Select.Option>
              <Select.Option value="DOUBLE">DOUBLE</Select.Option>
              <Select.Option value="TEXT">TEXT</Select.Option>
              <Select.Option value="BOOLEAN">BOOLEAN</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="encoding" label={t('编码')} rules={[{ required: true }]}>
            <Select defaultValue="RLE">
              <Select.Option value="RLE">RLE</Select.Option>
              <Select.Option value="PLAIN">PLAIN</Select.Option>
              <Select.Option value="TS_2DIFF">TS_2DIFF</Select.Option>
              <Select.Option value="GORILLA_V1">GORILLA_V1</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="compression" label={t('压缩')} rules={[{ required: true }]}>
            <Select defaultValue="LZ4">
              <Select.Option value="LZ4">LZ4</Select.Option>
              <Select.Option value="SNAPPY">SNAPPY</Select.Option>
              <Select.Option value="GZIP">GZIP</Select.Option>
              <Select.Option value="NONE">NONE</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('创建')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TemplateManagement;
