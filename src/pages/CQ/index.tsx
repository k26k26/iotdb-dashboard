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
import { useI18n } from '../../i18n';
import type { CqInfo } from '../../types/api';

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** `RESAMPLE EVERY` and `GROUP BY (…)` both take a bare duration literal. */
const DURATION = /^\d+(ms|s|m|h|d|w)$/;
/** Paths and aggregates reach the statement as raw SQL, so keep separators out of them. */
const FRAGMENT = /^[A-Za-z0-9_.()*-]+$/;
const METRICS = /^[A-Za-z_][A-Za-z0-9_]*(\s*,\s*[A-Za-z_][A-Za-z0-9_]*)*$/;

/** CQState: a CQ is ACTIVE unless the cluster is mid-rollback. */
const stateColor = (state: string): string => (state === 'ACTIVE' ? 'success' : 'default');

interface CqForm {
  cqId: string;
  select: string;
  intoPath: string;
  intoMetrics: string;
  fromPath: string;
  groupBy: string;
  resampleEvery?: string;
  timeoutPolicy?: string;
}

/** Clause order is fixed by the parser: id, then RESAMPLE, then TIMEOUT, then BEGIN. */
const buildCreate = (values: CqForm): string => {
  const resample = values.resampleEvery ? ` RESAMPLE EVERY ${values.resampleEvery}` : '';
  const timeout = values.timeoutPolicy ? ` TIMEOUT POLICY ${values.timeoutPolicy}` : '';
  const metrics = values.intoMetrics
    .split(',')
    .map((metric) => metric.trim())
    .join(', ');
  return (
    `CREATE CONTINUOUS QUERY ${values.cqId}${resample}${timeout} BEGIN ` +
    `SELECT ${values.select} INTO ${values.intoPath}(${metrics}) ` +
    `FROM ${values.fromPath} GROUP BY (${values.groupBy}) END`
  );
};

const CqManagement: React.FC = () => {
  const [cqs, setCqs] = useState<CqInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchCqs = async () => {
    setLoading(true);
    try {
      const rows = await queryRows('SHOW CONTINUOUS QUERIES');
      setCqs(
        rows.map((row) => ({
          cqId: String(row.CQId ?? ''),
          query: String(row.Query ?? ''),
          state: String(row.State ?? ''),
        }))
      );
      setError('');
    } catch (err: any) {
      setError(t('获取连续查询列表失败: {msg}', { msg: err.response?.data?.message || err.message }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCqs();
  }, []);

  const handleCreate = async (values: CqForm) => {
    try {
      await nonQuery(buildCreate(values));
      message.success(t('连续查询创建成功'));
      setCreateError('');
      setModalOpen(false);
      form.resetFields();
      fetchCqs();
    } catch (err: any) {
      const detail = err.response?.data?.message || err.message;
      setCreateError(detail);
      message.error(t('创建失败: {msg}', { msg: detail }));
    }
  };

  const handleDelete = async (cqId: string) => {
    try {
      await nonQuery(`DROP CONTINUOUS QUERY ${cqId}`);
      message.success(t('连续查询删除成功'));
      fetchCqs();
    } catch (err: any) {
      message.error(t('删除失败: {msg}', { msg: err.response?.data?.message || err.message }));
    }
  };

  const columns = [
    { title: t('CQ 名称'), dataIndex: 'cqId', key: 'cqId' },
    {
      title: t('状态'),
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => <Tag color={stateColor(state)}>{state}</Tag>,
    },
    { title: t('语句'), dataIndex: 'query', key: 'query', ellipsis: true, width: 520 },
    {
      title: t('操作'),
      key: 'action',
      render: (_: unknown, record: CqInfo) => (
        <Popconfirm title={t('确定删除该连续查询吗？')} onConfirm={() => handleDelete(record.cqId)}>
          <Button type="link" danger>
            {t('删除')}
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={t('连续查询管理')}
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchCqs}>
              {t('刷新')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              {t('创建 CQ')}
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={error} />
          ) : (
            <Table
              dataSource={cqs}
              rowKey="cqId"
              columns={columns}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
              locale={{
                emptyText: (
                  <Alert
                    type="info"
                    showIcon
                    title={t('暂无连续查询')}
                    description={t('查询成功，当前集群没有连续查询。CQ 按 GROUP BY 的窗口周期重算一条聚合查询，并把结果写进 INTO 指定的目标路径；不填 RESAMPLE EVERY 时，执行间隔等于 GROUP BY 窗口大小。')}
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={t('创建连续查询')}
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
            title={t('服务端拒绝了这条 CREATE CONTINUOUS QUERY 语句')}
            description={createError}
            style={{ marginBottom: 16 }}
          />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ groupBy: '1m' }}
        >
          <Form.Item
            name="cqId"
            label={t('CQ 名称')}
            rules={[
              { required: true, message: t('请输入名称') },
              { pattern: NAME, message: t('仅限字母、数字和下划线，且不能以数字开头') },
            ]}
          >
            <Input placeholder="cq_1" />
          </Form.Item>
          <Form.Item
            name="select"
            label={t('SELECT 表达式')}
            rules={[
              { required: true, message: t('请输入聚合表达式') },
              { pattern: FRAGMENT, message: t('仅允许测点名、函数、* 与运算符，不要带引号或分号') },
            ]}
            extra={t('聚合函数按窗口计算，例如 max_value(temperature)。')}
          >
            <Input placeholder="max_value(temperature)" />
          </Form.Item>
          <Form.Item
            name="intoPath"
            label={t('INTO 设备路径')}
            rules={[
              { required: true, message: t('请输入目标设备路径') },
              { pattern: FRAGMENT, message: t('仅允许以 root 开头的路径字符') },
            ]}
          >
            <Input placeholder="root.sg.d1" />
          </Form.Item>
          <Form.Item
            name="intoMetrics"
            label={t('INTO 目标测点')}
            rules={[
              { required: true, message: t('请输入目标测点名，多个用逗号分隔') },
              { pattern: METRICS, message: t('测点名为字母、数字、下划线，逗号分隔') },
            ]}
            extra={t('INTO 必须写成 路径(测点)，数量要与 SELECT 表达式一致。')}
          >
            <Input placeholder="s1_max" />
          </Form.Item>
          <Form.Item
            name="fromPath"
            label={t('FROM 来源路径')}
            rules={[
              { required: true, message: t('请输入来源路径') },
              { pattern: FRAGMENT, message: t('仅允许路径字符与 * 通配') },
            ]}
          >
            <Input placeholder="root.sg.d1" />
          </Form.Item>
          <Form.Item
            name="groupBy"
            label={t('GROUP BY 窗口')}
            rules={[
              { required: true, message: t('请输入窗口大小') },
              { pattern: DURATION, message: t('时长字面量，例如 30s、1m、1h') },
            ]}
          >
            <Input placeholder="1m" />
          </Form.Item>
          <Form.Item
            name="resampleEvery"
            label="RESAMPLE EVERY"
            rules={[{ pattern: DURATION, message: t('时长字面量，例如 30s、1m、1h') }]}
            extra={t('留空则按 GROUP BY 的窗口大小执行。')}
          >
            <Input placeholder="30s" />
          </Form.Item>
          <Form.Item name="timeoutPolicy" label="TIMEOUT POLICY" extra={t('上一个窗口还没算完时怎么处理。')}>
            <Select allowClear placeholder={t('服务端默认')}>
              <Select.Option value="BLOCKED">BLOCKED</Select.Option>
              <Select.Option value="DISCARD">DISCARD</Select.Option>
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

export default CqManagement;
