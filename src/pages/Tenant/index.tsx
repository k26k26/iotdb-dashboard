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
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
} from 'antd';
import { PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { nonQuery, queryRows } from '../../services/rest';

/** Tenant names become a node under `root`, so only a plain identifier may reach the statement. */
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PATH = /^[A-Za-z0-9_.]+$/;
/** ASTVisitor.parseSpaceQuotaSizeUnit reads the last character as the unit: M/G/T/P, or `unlimited`. */
const SIZE = /^(unlimited|\d+[MGTP])$/i;

const describe = (err: any): string => err.response?.data?.message || err.message || '请求失败';

/**
 * Every quota statement is guarded by `isQuotaEnable()` in ASTVisitor, and this cluster ships with
 * `quota_enable=false`, so the read always lands here. `SHOW VARIABLES` does not list that property,
 * so the refusal is the only way the page can learn it -- name the switch instead of looking broken.
 */
const explain = (detail: string): string =>
  detail.startsWith('Limit configuration is not enabled')
    ? `${detail}（本集群 quota_enable=false：在 iotdb-system.properties 里把它设为 true 并重启节点，配额语句才会执行）`
    : detail;

interface TenantRow {
  database: string;
  schemaReplication: string;
  dataReplication: string;
  partitionInterval: string;
}

interface QuotaForm {
  devices?: number | null;
  timeseries?: number | null;
  disk?: string;
}

/** The three keys ASTVisitor.visitSetSpaceQuota accepts; `disk` is quoted because its value is not a number. */
const quotaPairs = (values: QuotaForm): string[] => {
  const pairs: string[] = [];
  if (values.devices) pairs.push(`devices=${values.devices}`);
  if (values.timeseries) pairs.push(`timeseries=${values.timeseries}`);
  if (values.disk) pairs.push(`disk='${values.disk}'`);
  return pairs;
};

const quotaFields = (
  <>
    <Form.Item name="devices" label="设备数上限" extra="留空表示不改这一项">
      <InputNumber min={1} style={{ width: '100%' }} placeholder="1000" />
    </Form.Item>
    <Form.Item name="timeseries" label="时间序列数上限">
      <InputNumber min={1} style={{ width: '100%' }} placeholder="10000" />
    </Form.Item>
    <Form.Item
      name="disk"
      label="磁盘配额"
      extra="单位只认单个字母 M/G/T/P，或 unlimited"
      rules={[{ pattern: SIZE, message: "写成 100G 或 unlimited" }]}
    >
      <Input placeholder="100G" />
    </Form.Item>
  </>
);

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [quotaRows, setQuotaRows] = useState<Record<string, any>[]>([]);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaError, setQuotaError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [quotaOpen, setQuotaOpen] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState('');
  const [createForm] = Form.useForm();
  const [quotaForm] = Form.useForm();
  const { message } = AntdApp.useApp();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const rows = await queryRows('SHOW DATABASES');
      setTenants(
        rows
          .map((row) => ({
            database: String(row.Database ?? ''),
            schemaReplication: String(row.SchemaReplicationFactor ?? '-'),
            dataReplication: String(row.DataReplicationFactor ?? '-'),
            partitionInterval: String(row.TimePartitionInterval ?? '-'),
          }))
          .filter((row) => row.database)
      );
      setListError('');
    } catch (err: any) {
      setTenants([]);
      setListError(describe(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchQuota = async () => {
    setQuotaLoading(true);
    try {
      setQuotaRows(await queryRows('SHOW SPACE QUOTA'));
      setQuotaError('');
    } catch (err: any) {
      setQuotaRows([]);
      setQuotaError(explain(describe(err)));
    } finally {
      setQuotaLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
    fetchQuota();
  }, []);

  /** A tenant is not an object here, so it is created as what IoTDB actually gives you: a database. */
  const handleCreate = async (values: { name: string } & QuotaForm) => {
    const path = `root.${values.name}`;
    const pairs = quotaPairs(values);
    if (!NAME.test(values.name)) {
      const detail = `租户名 ${values.name} 不是合法标识符，语句没有发出`;
      setQuotaNotice(detail);
      message.error(detail);
      return;
    }
    try {
      await nonQuery(`CREATE DATABASE ${path}`);
    } catch (err: any) {
      setQuotaNotice(`创建失败: ${explain(describe(err))}`);
      message.error(`创建失败: ${explain(describe(err))}`);
      return;
    }
    if (pairs.length) {
      try {
        await nonQuery(`SET SPACE QUOTA ${pairs.join(', ')} ON ${path}`);
        message.success(`租户 ${path} 已创建并设置配额`);
      } catch (err: any) {
        // The database is already there, so only the limit failed -- report the half that happened.
        const detail = explain(describe(err));
        setQuotaNotice(`${path} 已创建，但配额未写入：${detail}`);
        message.warning(`${path} 已创建，但配额未设置：${detail}`);
      }
    } else {
      message.success(`租户 ${path} 已创建（未设置配额）`);
    }
    setCreateOpen(false);
    createForm.resetFields();
    fetchTenants();
    fetchQuota();
  };

  const handleSetQuota = async (values: { database: string } & QuotaForm) => {
    const pairs = quotaPairs(values);
    if (!pairs.length) {
      message.info('没有要写入的配额项');
      return;
    }
    try {
      await nonQuery(`SET SPACE QUOTA ${pairs.join(', ')} ON ${values.database}`);
      message.success(`已为 ${values.database} 设置配额`);
      setQuotaOpen(false);
      quotaForm.resetFields();
      fetchQuota();
    } catch (err: any) {
      const detail = explain(describe(err));
      setQuotaNotice(detail);
      message.error(`设置配额失败: ${detail}`);
    }
  };

  const handleDelete = async (database: string) => {
    try {
      await nonQuery(`DELETE DATABASE ${database}`);
      message.success(`已删除 ${database}`);
      fetchTenants();
    } catch (err: any) {
      message.error(`删除失败: ${explain(describe(err))}`);
    }
  };

  // The quota header row belongs to the server and is unreachable while quota_enable is off, so
  // render whatever keys come back rather than pinning columns this build never returns.
  const quotaHeaders = Object.keys(quotaRows[0] ?? {});
  const tenantOptions = tenants
    .filter((row) => PATH.test(row.database))
    .map((row) => ({ label: row.database, value: row.database }));

  return (
    <div>
      <Alert
        type="info"
        showIcon
        title="IoTDB 没有 CREATE TENANT 这条语句"
        description="两种解析器里都没有 TENANT 词法单元，所以租户要用现成的三样东西拼出来：一级数据库是路径边界（本页创建、删除），用户和角色是访问隔离（见「用户管理」），空间配额是资源上限（本页下方）。创建租户执行 CREATE DATABASE root.<名称>，删除租户执行 DELETE DATABASE，会连带删掉该路径下的全部数据。"
        style={{ marginBottom: 16 }}
      />

      {quotaNotice && (
        <Alert
          type="warning"
          showIcon
          closable
          title="服务端对配额语句的答复"
          description={quotaNotice}
          style={{ marginBottom: 16 }}
          onClose={() => setQuotaNotice('')}
        />
      )}

      <Card
        title="租户边界（一级数据库）"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchTenants}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              创建租户
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Spin spinning={loading}>
          {listError ? (
            <Alert type="error" showIcon title="SHOW DATABASES 被服务端拒绝" description={listError} />
          ) : (
            <Table
              dataSource={tenants}
              rowKey={(record) => record.database}
              size="small"
              pagination={{ pageSize: 20 }}
              columns={[
                { title: '租户路径', dataIndex: 'database', key: 'database' },
                { title: 'Schema 副本因子', dataIndex: 'schemaReplication', key: 'schemaReplication' },
                { title: 'Data 副本因子', dataIndex: 'dataReplication', key: 'dataReplication' },
                { title: '时间分区(ms)', dataIndex: 'partitionInterval', key: 'partitionInterval' },
                {
                  title: '操作',
                  key: 'action',
                  render: (_: unknown, record: TenantRow) => (
                    <Popconfirm
                      title={`确定删除 ${record.database} 吗？`}
                      description="该路径下的所有数据和时间序列都会一起删除，不可恢复。"
                      onConfirm={() => handleDelete(record.database)}
                    >
                      <Button type="link" danger disabled={!PATH.test(record.database)}>
                        删除租户
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
                    title="集群里还没有一级数据库"
                    description="SHOW DATABASES 返回了空列表。点「创建租户」会执行 CREATE DATABASE root.<名称>。"
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>

      <Card
        title="空间配额（SET SPACE QUOTA）"
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchQuota}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              disabled={!tenantOptions.length}
              onClick={() => setQuotaOpen(true)}
            >
              设置配额
            </Button>
          </Space>
        }
      >
        <Spin spinning={quotaLoading}>
          {quotaError ? (
            <Alert type="error" showIcon title="本集群当前读不到配额" description={quotaError} />
          ) : (
            <Table
              dataSource={quotaRows}
              rowKey={(record) => JSON.stringify(record)}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
              columns={quotaHeaders.map((header) => ({
                title: header,
                dataIndex: header,
                key: header,
                ellipsis: true,
              }))}
              locale={{
                emptyText: (
                  <Alert
                    type="info"
                    showIcon
                    title="还没有给任何数据库设置配额"
                    description="SHOW SPACE QUOTA 查询成功但列表为空，说明 quota_enable 已开启，只是还没有人写过上限。点「设置配额」提交 devices / timeseries / disk。"
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>

      <Modal title="创建租户" open={createOpen} onCancel={() => setCreateOpen(false)} footer={null}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="租户名"
            extra="会创建一级数据库 root.<租户名>；配额三项都可留空"
            rules={[
              { required: true, message: '请输入租户名' },
              { pattern: NAME, message: '仅限字母、数字和下划线，且不能以数字开头' },
            ]}
          >
            <Input placeholder="tenant_1" />
          </Form.Item>
          {quotaFields}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="设置空间配额" open={quotaOpen} onCancel={() => setQuotaOpen(false)} footer={null}>
        <Form form={quotaForm} layout="vertical" onFinish={handleSetQuota}>
          <Form.Item
            name="database"
            label="目标数据库"
            rules={[{ required: true, message: '请选择数据库' }]}
          >
            <Select
              showSearch
              placeholder="选择一个一级数据库"
              options={tenantOptions}
            />
          </Form.Item>
          {quotaFields}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantManagement;
