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

import React, { useRef, useState } from 'react';
import { App as AntdApp, Alert, Button, Card, Select, Space, Table, Typography } from 'antd';
import { UploadOutlined, ExportOutlined } from '@ant-design/icons';
import { query, insertTablet } from '../../services/rest';
import { shapeResult } from '../../utils/queryResult';
import { parseCsv, toCsv } from '../../utils/csv';

const { Text } = Typography;

const DATA_TYPES = ['INT32', 'INT64', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'TEXT'];
const BATCH_ROWS = 5000;
const PREVIEW_ROWS = 5;

const isTimeHeader = (name: string) => /^(time|timestamp|时间)$/i.test(name.trim());

const filled = (cells: string[]) => cells.map((cell) => cell.trim()).filter((cell) => cell !== '');

const inferType = (cells: string[]): string => {
  const values = filled(cells);
  if (!values.length) return 'TEXT';
  if (values.every((v) => /^(true|false)$/i.test(v))) return 'BOOLEAN';
  if (values.every((v) => /^-?\d+$/.test(v) && BigInt(v) < 2n ** 63n && BigInt(v) > -(2n ** 63n))) {
    return 'INT64';
  }
  if (values.every((v) => /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(v))) return 'DOUBLE';
  return 'TEXT';
};

const parseTime = (cell: string | undefined): number | null => {
  const value = (cell ?? '').trim();
  if (!value) return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const castValue = (cell: string | undefined, dataType: string): string | number | boolean | null => {
  const value = (cell ?? '').trim();
  if (value === '') return null;
  if (dataType === 'BOOLEAN') return /^true$/i.test(value);
  if (dataType === 'TEXT') return value;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

// In the tree model a path's last node is the measurement and everything before it is the
// device, so one CSV whose columns are full paths can address many devices at once.
const splitPath = (path: string) => {
  const cut = path.lastIndexOf('.');
  return cut < 0 ? { device: '', measurement: path } : { device: path.slice(0, cut), measurement: path.slice(cut + 1) };
};

interface ColumnPlan {
  index: number;
  timeseries: string;
  device: string;
  measurement: string;
  dataType: string;
}

interface ImportPlan {
  timeIndex: number;
  columns: ColumnPlan[];
  rows: string[][];
  skipped: number;
}

const DataManagement: React.FC = () => {
  const { message, modal } = AntdApp.useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);

  const exportCSV = async () => {
    setExporting(true);
    try {
      // `SELECT * FROM root` parses but matches nothing in the tree model; the wildcard suffix
      // is what makes it span every database.
      const result = await query('SELECT * FROM root.**');
      const { fields, rows } = shapeResult(result);
      const blob = new Blob(['\ufeff' + toCsv(fields.map((f) => f.title), rows.map((row) => fields.map((f) => row[f.key])))], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `iotdb_export_${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      message.success(`已导出 ${rows.length} 行`);
    } catch (error: any) {
      message.error(`导出失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setParseError('');
    setPlan(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const { header, rows } = parseCsv(await file.text());
      const timeIndex = header.findIndex(isTimeHeader);
      const dataCols = header
        .map((name, index) => ({ name, index }))
        .filter(({ name, index }) => index !== timeIndex && name !== '');
      if (timeIndex < 0) {
        setParseError('未找到 Time 列。导入要求每行带时间戳，请用本页面「导出数据」生成的 CSV。');
        return;
      }
      if (!dataCols.length) {
        setParseError('除时间外没有可导入的列。');
        return;
      }
      const kept = rows.filter((row) => parseTime(row[timeIndex]) !== null);
      setPlan({
        timeIndex,
        columns: dataCols.map(({ name, index }) => ({
          index,
          timeseries: name,
          ...splitPath(name),
          dataType: inferType(rows.map((row) => row[index])),
        })),
        rows: kept,
        skipped: rows.length - kept.length,
      });
    } catch (error: any) {
      setParseError(`读取 CSV 失败: ${error.message}`);
    }
  };

  const changeType = (index: number, dataType: string) =>
    setPlan((prev) =>
      prev
        ? { ...prev, columns: prev.columns.map((c) => (c.index === index ? { ...c, dataType } : c)) }
        : prev
    );

  const runImport = async () => {
    if (!plan) return;
    setImporting(true);
    const devices = [...new Set(plan.columns.map((c) => c.device))];
    try {
      for (let start = 0; start < plan.rows.length; start += BATCH_ROWS) {
        const batch = plan.rows.slice(start, start + BATCH_ROWS);
        const timestamps = batch.map((row) => parseTime(row[plan.timeIndex]) as number);
        for (const device of devices) {
          const columns = plan.columns.filter((c) => c.device === device);
          await insertTablet({
            device,
            timestamps,
            measurements: columns.map((c) => c.measurement),
            data_types: columns.map((c) => c.dataType),
            is_aligned: false,
            values: columns.map((column) =>
              batch.map((row) => castValue(row[column.index], column.dataType))
            ),
          });
        }
      }
      message.success(`导入完成：${plan.rows.length} 行 × ${plan.columns.length} 列 / ${devices.length} 个设备`);
      setPlan(null);
      setFileName('');
    } catch (error: any) {
      message.error(`导入失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const planData = (plan?.columns ?? []).map((c) => ({ ...c, key: c.index }));
  const previewData = plan
    ? plan.rows.slice(0, PREVIEW_ROWS).map((row, r) => ({
        key: r,
        time: parseTime(row[plan.timeIndex]),
        ...Object.fromEntries(plan.columns.map((c) => [`c${c.index}`, row[c.index] ?? ''])),
      }))
    : [];

  return (
    <div>
      <Card title="数据管理" size="small">
        <Space>
          <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
            上传 CSV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={onPickFile}
          />
          <Button icon={<ExportOutlined />} onClick={exportCSV} loading={exporting}>
            导出数据
          </Button>
        </Space>

        {parseError && (
          <Alert type="error" showIcon title="无法解析 CSV" description={parseError} style={{ marginTop: 16 }} />
        )}

        {plan && (
          <Card
            size="small"
            type="inner"
            style={{ marginTop: 16 }}
            title={
              <Space>
                <span>导入预览：{fileName}</span>
                <Text type="secondary">
                  {plan.rows.length} 行 × {plan.columns.length} 列 / {new Set(plan.columns.map((c) => c.device)).size} 个设备
                  {plan.skipped > 0 ? `，跳过 ${plan.skipped} 行无有效时间戳` : ''}
                </Text>
              </Space>
            }
            extra={
              <Space>
                <Button onClick={() => setPlan(null)}>取消</Button>
                <Button
                  type="primary"
                  loading={importing}
                  disabled={plan.rows.length === 0}
                  onClick={() =>
                    modal.confirm({
                      title: '确认写入 IoTDB？',
                      content: `将向 ${new Set(plan.columns.map((c) => c.device)).size} 个设备写入 ${plan.rows.length} 行，同时间戳的同测点会被覆盖。`,
                      onOk: runImport,
                    })
                  }
                >
                  导入
                </Button>
              </Space>
            }
          >
            <Table
              size="small"
              pagination={false}
              scroll={{ y: 240 }}
              dataSource={planData}
              columns={[
                { title: '设备', dataIndex: 'device', key: 'device' },
                { title: '测点', dataIndex: 'measurement', key: 'measurement' },
                {
                  title: '数据类型',
                  key: 'dataType',
                  width: 140,
                  render: (_: unknown, record: ColumnPlan & { key: number }) => (
                    <Select
                      size="small"
                      value={record.dataType}
                      options={DATA_TYPES.map((t) => ({ value: t, label: t }))}
                      onChange={(dataType) => changeType(record.index, dataType)}
                    />
                  ),
                },
              ]}
            />
            <Table
              size="small"
              style={{ marginTop: 12 }}
              pagination={false}
              scroll={{ x: 'max-content' }}
              dataSource={previewData}
              columns={[
                { title: 'Time', dataIndex: 'time', key: 'time', width: 160 },
                // Full paths as titles: measurement names repeat across devices in an export
                // that spans several, and the tail alone would not say which cell is which.
                ...plan.columns.map((c) => ({
                  title: c.timeseries,
                  dataIndex: `c${c.index}`,
                  key: `c${c.index}`,
                  render: (value: string) => <Text type="secondary">{value}</Text>,
                })),
              ]}
            />
          </Card>
        )}
      </Card>
    </div>
  );
};

export default DataManagement;
