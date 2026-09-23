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
import { App as AntdApp, Card, Table, Button, Modal, Form, Input, Select, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { queryRows, nonQuery } from '../../services/rest';
import { useI18n } from '../../i18n';
import type { TimeseriesInfo } from '../../types/api';

const TimeseriesManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [timeseries, setTimeseries] = useState<TimeseriesInfo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchTimeseries = async () => {
    setLoading(true);
    try {
      const rows = await queryRows('SHOW TIMESERIES');
      setTimeseries(
        rows.map((row) => ({
          timeseries: String(row.Timeseries),
          datatype: row.DataType || '',
          encoding: row.Encoding || '',
          compression: row.Compression || '',
        }))
      );
    } catch (error: any) {
      message.error(t('获取测点列表失败: {msg}', { msg: error.response?.data?.message || error.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeseries();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(
        `CREATE TIMESERIES ${values.path} WITH DATATYPE=${values.datatype}, ENCODING=${values.encoding}, COMPRESSION=${values.compression}`
      );
      message.success(t('测点创建成功'));
      setModalOpen(false);
      form.resetFields();
      fetchTimeseries();
    } catch (error: any) {
      message.error(t('创建失败: {msg}', { msg: error.response?.data?.message || error.message }));
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await nonQuery(`DELETE TIMESERIES ${path}`);
      message.success(t('测点删除成功'));
      fetchTimeseries();
    } catch (error: any) {
      message.error(t('删除失败: {msg}', { msg: error.response?.data?.message || error.message }));
    }
  };

  const columns = [
    { title: t('路径'), dataIndex: 'timeseries', key: 'timeseries' },
    { title: t('数据类型'), dataIndex: 'datatype', key: 'datatype' },
    { title: t('编码'), dataIndex: 'encoding', key: 'encoding' },
    { title: t('压缩'), dataIndex: 'compression', key: 'compression' },
    {
      title: t('操作'),
      key: 'action',
      render: (_: any, record: TimeseriesInfo) => (
        <Popconfirm title={t('确定删除该测点吗？')} onConfirm={() => handleDelete(record.timeseries)}>
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
        title={t('测点管理')}
        size="small"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {t('创建测点')}
          </Button>
        }
      >
        <Table
          dataSource={timeseries.map((item) => ({ ...item, key: item.timeseries }))}
          columns={columns}
          loading={loading}
          size="small"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={t('创建测点')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ datatype: 'INT64', encoding: 'RLE', compression: 'LZ4' }}
          onFinish={handleCreate}
        >
          <Form.Item name="path" label={t('路径')} rules={[{ required: true }]}>
            <Input placeholder="root.sg.d1.s1" />
          </Form.Item>
          <Form.Item name="datatype" label={t('数据类型')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="INT64">INT64</Select.Option>
              <Select.Option value="INT32">INT32</Select.Option>
              <Select.Option value="FLOAT">FLOAT</Select.Option>
              <Select.Option value="DOUBLE">DOUBLE</Select.Option>
              <Select.Option value="TEXT">TEXT</Select.Option>
              <Select.Option value="BOOLEAN">BOOLEAN</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="encoding" label={t('编码')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="RLE">RLE</Select.Option>
              <Select.Option value="PLAIN">PLAIN</Select.Option>
              <Select.Option value="TS_2DIFF">TS_2DIFF</Select.Option>
              <Select.Option value="GORILLA_V1">GORILLA_V1</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="compression" label={t('压缩')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="LZ4">LZ4</Select.Option>
              <Select.Option value="SNAPPY">SNAPPY</Select.Option>
              <Select.Option value="GZIP">GZIP</Select.Option>
              <Select.Option value="NONE">NONE</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('创建')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimeseriesManagement;
