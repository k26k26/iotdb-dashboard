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
import { App as AntdApp, Card, Table, Button, Modal, Form, Input, InputNumber, Space, Popconfirm, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { query, nonQuery, assertRestOk } from '../../services/rest';
import { useI18n } from '../../i18n';

interface DatabaseInfo {
  database: string;
  schemaReplicationFactor?: number;
  dataReplicationFactor?: number;
  timePartitionInterval?: number;
}

const DatabaseManagement: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchDatabases = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW DATABASES');
      assertRestOk(result);
      const columns = Array.isArray(result.column_names) ? result.column_names : [];
      const table = Array.isArray(result.values) ? result.values : [];
      // values is column-oriented: one array per column, addressed by name from column_names.
      const columnOf = (name: string): any[] => {
        const index = columns.indexOf(name);
        return index >= 0 && Array.isArray(table[index]) ? table[index] : [];
      };
      const names = columnOf('Database');
      const schemaReplicas = columnOf('SchemaReplicationFactor');
      const dataReplicas = columnOf('DataReplicationFactor');
      const partitions = columnOf('TimePartitionInterval');
      setDatabases(
        names.map((database, i) => ({
          database: String(database),
          schemaReplicationFactor: schemaReplicas[i],
          dataReplicationFactor: dataReplicas[i],
          timePartitionInterval: partitions[i],
        }))
      );
    } catch (error: any) {
      message.error(t('获取数据库列表失败: {msg}', { msg: error.response?.data?.message || error.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await nonQuery(`CREATE DATABASE ${values.name}`);
      if (values.ttl) {
        await nonQuery(`SET TTL ${values.name} TO ${values.ttl}`);
      }
      message.success(t('数据库创建成功'));
      setModalOpen(false);
      form.resetFields();
      fetchDatabases();
    } catch (error: any) {
      message.error(t('创建失败: {msg}', { msg: error.response?.data?.message || error.message }));
    }
  };

  const handleDelete = async (database: string) => {
    try {
      await nonQuery(`DROP DATABASE ${database}`);
      message.success(t('数据库删除成功'));
      fetchDatabases();
    } catch (error: any) {
      message.error(t('删除失败: {msg}', { msg: error.response?.data?.message || error.message }));
    }
  };

  const columns = [
    { title: t('数据库名'), dataIndex: 'database', key: 'database' },
    {
      title: t('Schema 副本数'),
      dataIndex: 'schemaReplicationFactor',
      key: 'schemaReplicationFactor',
    },
    {
      title: t('数据副本数'),
      dataIndex: 'dataReplicationFactor',
      key: 'dataReplicationFactor',
    },
    {
      title: t('时间分区间隔 (ms)'),
      dataIndex: 'timePartitionInterval',
      key: 'timePartitionInterval',
    },
    {
      title: t('操作'),
      key: 'action',
      render: (_: any, record: DatabaseInfo) => (
        <Space>
          <Popconfirm title={t('确定删除该数据库吗？')} onConfirm={() => handleDelete(record.database)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t('删除')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('数据库管理')}
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchDatabases}>
              {t('刷新')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              {t('创建数据库')}
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <Table
            dataSource={databases.map((db) => ({ ...db, key: db.database }))}
            columns={columns}
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title={t('创建数据库')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label={t('数据库名')} rules={[{ required: true, message: t('请输入数据库名') }]}>
            <Input placeholder="root.sg" />
          </Form.Item>
          <Form.Item name="ttl" label={t('TTL (可选，单位：毫秒)')}>
            <InputNumber min={0} style={{ width: '100%' }} />
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

export default DatabaseManagement;
