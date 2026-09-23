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

import React, { useCallback, useEffect, useState } from 'react';
import { App as AntdApp, Alert, Button, Card, Input, Space, Spin, Table } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { assertRestOk, query, queryRows } from '../../services/rest';
import { shapeResult } from '../../utils/queryResult';
import type { Field } from '../../utils/queryResult';
import { toCsv } from '../../utils/csv';
import { t, useI18n } from '../../i18n';

const AUDIT_NS = 'root.__audit';
const LIMIT = 200;

const describe = (err: any): string => err.response?.data?.message || err.message || t('请求失败');

/**
 * A tree SELECT names every column with the full timeseries path, so under the audit namespace the
 * readable part is `<device>.<measurement>`. Shorten to the measurement only while those stay unique:
 * with several nodes writing audit rows, the device is precisely what tells two columns apart.
 */
const titlesOf = (fields: Field[]): string[] => {
  const suffixes = fields.map((field) =>
    field.title.startsWith(`${AUDIT_NS}.`) ? field.title.slice(AUDIT_NS.length + 1) : field.title
  );
  const measurements = suffixes.map((suffix) => suffix.split('.').pop() || suffix);
  return new Set(measurements).size === measurements.length ? measurements : suffixes;
};

/**
 * Audit is designed but not wired in this build. `AUDIT` is only an unreserved keyword in both
 * grammars (there is no audit statement), `enable_audit_log` defaults to false, and even with it on
 * `DNAuditLogger.log()` / `logFromCN()` and `CNAuditLogger.log()` are empty method bodies -- so the
 * `root.__audit` namespace those 12 audit measurements were designed for never gets created. The probe
 * says which side of that line the cluster is on instead of showing an invented six-column table.
 */
const AuditLogs: React.FC = () => {
  const [fields, setFields] = useState<Field[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [namespace, setNamespace] = useState<'unknown' | 'absent' | 'present'>('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const devices = await queryRows(`SHOW DEVICES ${AUDIT_NS}.**`);
      if (!devices.length) {
        setNamespace('absent');
        setFields([]);
        setRows([]);
        setError('');
        return;
      }
      setNamespace('present');
      const result = await query(`SELECT * FROM ${AUDIT_NS}.** ORDER BY time DESC LIMIT ${LIMIT}`);
      assertRestOk(result);
      const shaped = shapeResult(result);
      setFields(shaped.fields);
      setRows(shaped.rows);
      setError('');
    } catch (err: any) {
      setNamespace('unknown');
      setRows([]);
      setError(describe(err));
      message.error(t('获取审计日志失败: {msg}', { msg: describe(err) }));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const titles = titlesOf(fields);
  const keyword = filter.trim().toLowerCase();
  const visible = keyword
    ? rows.filter((row) =>
        Object.entries(row).some(
          ([key, value]) => key !== 'key' && String(value).toLowerCase().includes(keyword)
        )
      )
    : rows;

  const exportAudit = () => {
    const csv = toCsv(
      titles,
      visible.map((row) => fields.map((field) => row[field.key]))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    message.success(t('已导出 {n} 行', { n: visible.length }));
  };

  const columns = fields.map((field, i) => ({
    title: titles[i],
    dataIndex: field.key,
    key: field.key,
    ellipsis: true,
    render: (value: unknown) =>
      field.key === '__time' ? new Date(Number(value)).toLocaleString() : String(value ?? ''),
  }));

  return (
    <div>
      <Card
        title={t('审计日志')}
        size="small"
        extra={
          <Space>
            <Input
              placeholder={t('过滤已取回的结果')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
              {t('刷新')}
            </Button>
            <Button icon={<DownloadOutlined />} disabled={!visible.length} onClick={exportAudit}>
              {t('导出')}
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={t('审计状态探测失败')} description={error} />
          ) : (
            <Table
              dataSource={visible}
              columns={columns}
              rowKey={(record) => String(record.key)}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
              locale={{
                emptyText: (
                  <Alert
                    type="info"
                    showIcon
                    title={
                      namespace === 'absent'
                        ? t('服务端还没有 {ns} 这个库', { ns: AUDIT_NS })
                        : keyword
                          ? t('当前过滤条件下没有匹配行（共 {n} 行）', { n: rows.length })
                          : t('审计命名空间存在，但 {n} 条以内没有记录', { n: LIMIT })
                    }
                    description={
                      namespace === 'absent'
                        ? t('SHOW DEVICES {ns}.** 查询成功、返回 0 行。本版本没有审计类语句（AUDIT 在两种解析器里都只是普通关键字），enable_audit_log 默认关闭；而且即使打开，2.0.11 的 DNAuditLogger.log()/logFromCN() 与 CNAuditLogger.log() 都是空方法体，服务端不会写入任何审计行。要在这一页读到真实审计，得等服务端把那三个方法实现出来。', { ns: AUDIT_NS })
                        : t('SELECT * FROM {ns}.** ORDER BY time DESC 查询成功但没有行；过滤只作用在已经取回的结果上，不会再拼进语句里发给服务端。', { ns: AUDIT_NS })
                    }
                  />
                ),
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default AuditLogs;
