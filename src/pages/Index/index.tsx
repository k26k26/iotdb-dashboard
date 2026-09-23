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
import { App as AntdApp, Alert, Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Spin, Table } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { queryTable, queryTableRows } from '../../services/rest';
import { getColumns, getDatabases, getTables } from '../../services/metadata';
import { t, useI18n } from '../../i18n';

/** Index names and column names are interpolated raw, so only plain identifiers may reach the statement. */
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

const describe = (err: any): string => err.response?.data?.message || err.message || t('请求失败');

/** An index is a table-level object: `SHOW INDEXES` has no global form and needs `FROM <db.table>`. */
const qualify = (database: string, table: string): string => {
  if (!NAME.test(database) || !NAME.test(table)) {
    throw new Error(t('库表名 {db}.{tb} 不是合法标识符', { db: database, tb: table }));
  }
  return `${database}.${table}`;
};

/**
 * StatementAnalyzer.visitShowIndex/visitCreateIndex/visitDropIndex all throw a SemanticException, so
 * the relational layer answers SHOW INDEXES with "…not supported yet." and the writes with a bare
 * `EXECUTE_STATEMENT_ERROR` that carries no reason. Say so, or the code looks like a dashboard bug.
 */
const explain = (detail: string): string =>
  detail === 'EXECUTE_STATEMENT_ERROR'
    ? t('{detail}（本版本服务端未实现索引功能，CREATE/DROP INDEX 一律被拒绝）', { detail })
    : detail;

const IndexManagement: React.FC = () => {
  const [databases, setDatabases] = useState<string[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  const [database, setDatabase] = useState('');
  const [table, setTable] = useState('');
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchIndexes = async (db: string, tb: string) => {
    if (!db || !tb) return;
    setLoading(true);
    try {
      setRows(await queryTableRows(`SHOW INDEXES FROM ${qualify(db, tb)}`));
      setError('');
    } catch (err: any) {
      setRows([]);
      setError(describe(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDatabases()
      .then((list) => {
        setDatabases(list);
        setDatabase((current) => current || list[0] || '');
      })
      .catch((err) => setError(describe(err)));
  }, []);

  useEffect(() => {
    if (!database) return;
    getTables(database)
      .then((list) => {
        const names = list.map((item) => item.table);
        setTables(names);
        setTable(names[0] || '');
      })
      .catch((err) => setError(describe(err)));
  }, [database]);

  useEffect(() => {
    if (!database || !table) return;
    fetchIndexes(database, table);
    getColumns(database, table)
      .then((list) => setTableColumns(list.map((item) => item.column)))
      .catch(() => setTableColumns([]));
  }, [database, table]);

  const handleCreate = async (values: { indexName: string; columns: string[] }) => {
    const targets = [values.indexName, ...values.columns];
    try {
      targets.forEach((item) => {
        if (!NAME.test(item)) throw new Error(t('{name} 不是合法标识符', { name: item }));
      });
      await queryTable(
        `CREATE INDEX ${values.indexName} ON ${qualify(database, table)} ${values.columns.join(', ')}`
      );
      message.success(t('索引创建成功'));
      setCreateError('');
      setModalOpen(false);
      form.resetFields();
      fetchIndexes(database, table);
    } catch (err: any) {
      const detail = explain(describe(err));
      setCreateError(detail);
      message.error(t('创建失败: {msg}', { msg: detail }));
    }
  };

  const handleDelete = async (indexName: string) => {
    try {
      if (!NAME.test(indexName)) throw new Error(t('{name} 不是合法标识符', { name: indexName }));
      await queryTable(`DROP INDEX ${indexName} ON ${qualify(database, table)}`);
      message.success(t('索引删除成功'));
      fetchIndexes(database, table);
    } catch (err: any) {
      message.error(t('删除失败: {msg}', { msg: explain(describe(err)) }));
    }
  };

  // The header row is server-defined and this build never gets far enough to send one, so render
  // whatever keys come back instead of pinning names that the statement may not use.
  const headers = Object.keys(rows[0] ?? {});

  return (
    <div>
      <Card
        title={t('索引管理')}
        size="small"
        extra={
          <Space>
            <Select
              style={{ width: 180 }}
              value={database || undefined}
              placeholder={t('数据库')}
              onChange={setDatabase}
              options={databases.map((item) => ({ label: item, value: item }))}
            />
            <Select
              style={{ width: 200 }}
              value={table || undefined}
              placeholder={t('表')}
              showSearch
              onChange={setTable}
              options={tables.map((item) => ({ label: item, value: item }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchIndexes(database, table)}>
              {t('刷新')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              {t('创建索引')}
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={t('{db}.{tb} 的索引无法读取', { db: database, tb: table })} description={error} />
          ) : (
            <Table
              dataSource={rows}
              rowKey={(record) => JSON.stringify(record)}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
              columns={[
                ...headers.map((header) => ({
                  title: header,
                  dataIndex: header,
                  key: header,
                  ellipsis: true,
                })),
                {
                  title: t('操作'),
                  key: 'action',
                  render: (_: unknown, record: Record<string, any>) => (
                    <Popconfirm
                      title={t('确定删除该索引吗？')}
                      onConfirm={() => handleDelete(String(Object.values(record)[0] ?? ''))}
                    >
                      <Button type="link" danger>
                        {t('删除')}
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
              locale={{
                emptyText: (
                  <Alert
                    type="info"
                    showIcon
                    title={t('{db}.{tb} 上没有索引', { db: database, tb: table })}
                    description={t('查询成功，这张表当前没有索引。表模型下只有一个系统库 information_schema 时，没有可建索引的用户表。')}
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={t('创建索引')}
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
            title={t('服务端拒绝了这条 CREATE INDEX 语句')}
            description={createError}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="indexName"
            label={t('索引名')}
            rules={[
              { required: true, message: t('请输入索引名') },
              { pattern: NAME, message: t('仅限字母、数字和下划线，且不能以数字开头') },
            ]}
          >
            <Input placeholder="idx_temperature" />
          </Form.Item>
          <Form.Item
            name="columns"
            label={t('索引列')}
            rules={[{ required: true, message: t('至少选择一个列') }]}
            extra={t('目标表：{target}。多选列会拼成 ON {target} a, b。', { target: `${database}.${table}` })}
          >
            <Select
              mode="multiple"
              placeholder={t('选择要建索引的列')}
              options={tableColumns.map((item) => ({ label: item, value: item }))}
            />
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

export default IndexManagement;
