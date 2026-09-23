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

import React, { useMemo, useRef, useState } from 'react';
import { App as AntdApp, Alert, Button, Card, Input, Select, Space, Table, Tooltip, Typography } from 'antd';
import { InfoCircleOutlined, UploadOutlined, ExportOutlined } from '@ant-design/icons';
import { query, insertTablet } from '../../services/rest';
import { shapeResult } from '../../utils/queryResult';
import { normalizeDevicePath, normalizePath } from '../../utils/path';
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
interface ParsedFile {
  fileName: string;
  timeIndex: number;
  dataCols: { index: number; name: string }[];
  allRows: string[][];
  rows: string[][];
  skipped: number;
}

/**
 * Every column has to resolve to `<device>.<measurement>` before anything is sent. The CSV this page
 * exports carries full paths, so splitting on the last dot suffices; hand-written CSVs usually name the
 * measurements only, which is what the 目标设备 field covers. An unresolved column is reported by name
 * instead of going out -- the server answers an empty `device` with `code 305 … root. is not a legal
 * path` and a relative one with `code 305 Path does not exist.`, so guessing here only produced a blank
 * 设备 row plus a message nobody could act on.
 */
const resolveTargets = (parsed: ParsedFile, prefixRaw: string) => {
  const trimmed = prefixRaw.trim();
  const prefixDevice = trimmed ? normalizeDevicePath(trimmed) : '';
  const issues: string[] = [];
  if (trimmed && !prefixDevice) {
    issues.push(
      '「目标设备」不是合法路径：树模型的设备必须以 root. 开头，只能含字母、数字、下划线或中文，不能带空格、引号或通配符。'
    );
  }
  const columns: ColumnPlan[] = [];
  parsed.dataCols.forEach(({ index, name }) => {
    const full = normalizePath(name);
    if (!full || full !== name) {
      issues.push(`列「${name}」不是合法的时间序列路径（不要带引号、空格或通配符）。`);
      return;
    }
    const cut = full.lastIndexOf('.');
    const rawDevice = cut < 0 ? prefixDevice : full.slice(0, cut);
    const measurement = cut < 0 ? full : full.slice(cut + 1);
    if (!rawDevice) {
      // A bad 目标设备 already says so once; repeating it per column buries the actual reason.
      if (!trimmed) {
        issues.push(`列「${name}」只有测点名、没有设备前缀——请在上方「目标设备」里填这批测点属于哪台设备。`);
      }
      return;
    }
    const device = normalizeDevicePath(rawDevice);
    if (!device) {
      issues.push(`列「${name}」的设备段「${rawDevice}」必须以 root. 开头。`);
      return;
    }
    columns.push({
      index,
      timeseries: name,
      device,
      measurement,
      dataType: inferType(parsed.allRows.map((row) => row[index])),
    });
  });
  return { columns, issues };
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
  const [prefix, setPrefix] = useState('');
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [parseError, setParseError] = useState('');
  const [importing, setImporting] = useState(false);

  const resolved = useMemo(() => (parsed ? resolveTargets(parsed, prefix) : null), [parsed, prefix]);
  const issues = resolved?.issues ?? [];
  const plan: ImportPlan | null = useMemo(() => {
    if (!parsed || !resolved || resolved.issues.length) return null;
    return {
      timeIndex: parsed.timeIndex,
      columns: resolved.columns.map((column) => ({
        ...column,
        dataType: overrides[column.index] ?? column.dataType,
      })),
      rows: parsed.rows,
      skipped: parsed.skipped,
    };
  }, [parsed, resolved, overrides]);
  const devices = useMemo(
    () => new Set((plan?.columns ?? []).map((column) => column.device)),
    [plan]
  );

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
    setParsed(null);
    setOverrides({});
    if (!file) return;
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
      setParsed({ fileName: file.name, timeIndex, dataCols, allRows: rows, rows: kept, skipped: rows.length - kept.length });
    } catch (error: any) {
      setParseError(`读取 CSV 失败: ${error.message}`);
    }
  };

  const changeType = (index: number, dataType: string) => setOverrides((prev) => ({ ...prev, [index]: dataType }));

  const runImport = async () => {
    if (!plan) return;
    setImporting(true);
    const targets = [...devices];
    try {
      for (let start = 0; start < plan.rows.length; start += BATCH_ROWS) {
        const batch = plan.rows.slice(start, start + BATCH_ROWS);
        const timestamps = batch.map((row) => parseTime(row[plan.timeIndex]) as number);
        for (const device of targets) {
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
      message.success(`导入完成：${plan.rows.length} 行 × ${plan.columns.length} 列 / ${targets.length} 个设备`);
      setParsed(null);
      setOverrides({});
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
        <Space wrap>
          <Tooltip title="CSV 的列名如果只有测点名（temperature 而不是 root.sg.d1.temperature），就统统挂到这台设备下；列名本身带完整路径时以列名为准。树模型的设备路径必须以 root. 开头。">
            <Text type="secondary">
              目标设备 <InfoCircleOutlined />
            </Text>
          </Tooltip>
          <Input
            placeholder="root.sg.d1（列名只写测点名时必填）"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            style={{ width: 340 }}
            allowClear
          />
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

        {(parseError || (parsed && issues.length > 0)) && (
          <Alert
            type="error"
            showIcon
            style={{ marginTop: 16 }}
            title="这份 CSV 还没法导入"
            description={
              <div>
                {parseError && <div>{parseError}</div>}
                {parsed &&
                  issues.slice(0, 8).map((line) => (
                    <div key={line}>
                      <code>{line}</code>
                    </div>
                  ))}
                {parsed && issues.length > 8 && <div>另有 {issues.length - 8} 列有同类问题。</div>}
              </div>
            }
          />
        )}

        {plan && (
          <Card
            size="small"
            type="inner"
            style={{ marginTop: 16 }}
            title={
              <Space>
                <span>导入预览：{parsed?.fileName}</span>
                <Text type="secondary">
                  {plan.rows.length} 行 × {plan.columns.length} 列 / {devices.size} 个设备
                  {plan.skipped > 0 ? `，跳过 ${plan.skipped} 行无有效时间戳` : ''}
                </Text>
              </Space>
            }
            extra={
              <Space>
                <Button onClick={() => setParsed(null)}>取消</Button>
                <Button
                  type="primary"
                  loading={importing}
                  disabled={plan.rows.length === 0}
                  onClick={() =>
                    modal.confirm({
                      title: '确认写入 IoTDB？',
                      content: `将向 ${devices.size} 个设备写入 ${plan.rows.length} 行，同时间戳的同测点会被覆盖。`,
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
