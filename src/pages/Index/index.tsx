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

/** Index names and column names are interpolated raw, so only plain identifiers may reach the statement. */
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

const describe = (err: any): string => err.response?.data?.message || err.message || '请求失败';

/** An index is a table-level object: `SHOW INDEXES` has no global form and needs `FROM <db.table>`. */
const qualify = (database: string, table: string): string => {
  if (!NAME.test(database) || !NAME.test(table)) {
    throw new Error(`库表名 ${database}.${table} 不是合法标识符`);
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
    ? `${detail}（本版本服务端未实现索引功能，CREATE/DROP INDEX 一律被拒绝）`
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
        if (!NAME.test(item)) throw new Error(`${item} 不是合法标识符`);
      });
      await queryTable(
        `CREATE INDEX ${values.indexName} ON ${qualify(database, table)} ${values.columns.join(', ')}`
      );
      message.success('索引创建成功');
      setCreateError('');
      setModalOpen(false);
      form.resetFields();
      fetchIndexes(database, table);
    } catch (err: any) {
      const detail = explain(describe(err));
      setCreateError(detail);
      message.error(`创建失败: ${detail}`);
    }
  };

  const handleDelete = async (indexName: string) => {
    try {
      if (!NAME.test(indexName)) throw new Error(`${indexName} 不是合法标识符`);
      await queryTable(`DROP INDEX ${indexName} ON ${qualify(database, table)}`);
      message.success('索引删除成功');
      fetchIndexes(database, table);
    } catch (err: any) {
      message.error(`删除失败: ${explain(describe(err))}`);
    }
  };

  // The header row is server-defined and this build never gets far enough to send one, so render
  // whatever keys come back instead of pinning names that the statement may not use.
  const headers = Object.keys(rows[0] ?? {});

  return (
    <div>
      <Card
        title="索引管理"
        size="small"
        extra={
          <Space>
            <Select
              style={{ width: 180 }}
              value={database || undefined}
              placeholder="数据库"
              onChange={setDatabase}
              options={databases.map((item) => ({ label: item, value: item }))}
            />
            <Select
              style={{ width: 200 }}
              value={table || undefined}
              placeholder="表"
              showSearch
              onChange={setTable}
              options={tables.map((item) => ({ label: item, value: item }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchIndexes(database, table)}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              创建索引
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={`${database}.${table} 的索引无法读取`} description={error} />
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
                  title: '操作',
                  key: 'action',
                  render: (_: unknown, record: Record<string, any>) => (
                    <Popconfirm
                      title="确定删除该索引吗？"
                      onConfirm={() => handleDelete(String(Object.values(record)[0] ?? ''))}
                    >
                      <Button type="link" danger>
                        删除
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
                    title={`${database}.${table} 上没有索引`}
                    description="查询成功，这张表当前没有索引。表模型下只有一个系统库 information_schema 时，没有可建索引的用户表。"
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="创建索引"
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
            title="服务端拒绝了这条 CREATE INDEX 语句"
            description={createError}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="indexName"
            label="索引名"
            rules={[
              { required: true, message: '请输入索引名' },
              { pattern: NAME, message: '仅限字母、数字和下划线，且不能以数字开头' },
            ]}
          >
            <Input placeholder="idx_temperature" />
          </Form.Item>
          <Form.Item
            name="columns"
            label="索引列"
            rules={[{ required: true, message: '至少选择一个列' }]}
            extra={`目标表：${database}.${table}。多选列会拼成 ON ${database}.${table} a, b。`}
          >
            <Select
              mode="multiple"
              placeholder="选择要建索引的列"
              options={tableColumns.map((item) => ({ label: item, value: item }))}
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

export default IndexManagement;
