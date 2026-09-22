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

import React, { useState, useCallback, useMemo } from 'react';
import { App as AntdApp, Card, Button, Space, Table, Row, Col, Empty } from 'antd';
import { PlayCircleOutlined, ExportOutlined, ClearOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { query } from '../../services/rest';
import { useQueryStore } from '../../stores/query';
import type { QueryResult } from '../../types/api';
import TimeSeriesChart from '../../components/TimeSeriesChart';

interface Field {
  title: string;
  key: string;
}

// /rest/v2/query answers column-oriented: values[colIndex][rowIndex]. Time is only ever in
// `timestamps`, and only the SHOW-style responses fill `column_names` -- a SELECT comes back
// with the names in `expressions` instead.
function shapeResult(result: QueryResult) {
  const cols = Array.isArray(result.values) ? result.values : [];
  const times = Array.isArray(result.timestamps) ? result.timestamps : [];
  const columnNames = Array.isArray(result.column_names) ? result.column_names : [];
  const expressions = Array.isArray(result.expressions) ? result.expressions : [];
  const named = columnNames.length ? columnNames : expressions;
  const names = named.length ? named : cols.map((_, j) => `column ${j + 1}`);
  const hasTime = times.length > 0;

  const fields: Field[] = [
    ...(hasTime ? [{ title: 'Time', key: '__time' }] : []),
    ...names.map((name, j) => ({ title: name, key: `c${j}` })),
  ];
  const rowCount = hasTime ? times.length : (cols[0]?.length ?? 0);
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const row: Record<string, unknown> = { key: i };
    if (hasTime) row.__time = times[i];
    names.forEach((_, j) => {
      row[`c${j}`] = cols[j]?.[i] ?? null;
    });
    return row;
  });

  return { fields, rows, hasTime };
}

const Query: React.FC = () => {
  const [sql, setSql] = useState('SELECT s1, s2 FROM root.sg.d1 LIMIT 100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const { addHistory } = useQueryStore();
  const { message } = AntdApp.useApp();

  const handleExecute = useCallback(async () => {
    if (!sql.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }
    setLoading(true);
    try {
      const startTime = Date.now();
      const res = await query(sql);
      const duration = Date.now() - startTime;
      setResult(res);
      useQueryStore.getState().setCurrentResult(res);
      const rowCount = shapeResult(res).rows.length;
      addHistory({
        id: Date.now().toString(),
        sql,
        timestamp: Date.now(),
        duration,
        rowCount,
      });
      message.success(`查询成功，返回 ${rowCount} 行`);
    } catch (error: any) {
      message.error(`查询失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [sql, addHistory, message]);

  const { fields, rows, hasTime } = useMemo(
    () => (result ? shapeResult(result) : { fields: [] as Field[], rows: [], hasTime: false }),
    [result]
  );

  const handleExportCSV = () => {
    if (!result) return;
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      fields.map((f) => cell(f.title)).join(','),
      ...rows.map((row) => fields.map((f) => cell(row[f.key])).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `query_result_${Date.now()}.csv`;
    link.click();
  };

  const columns = fields.map((f) => ({
    title: f.title,
    dataIndex: f.key,
    key: f.key,
    sorter: (a: Record<string, any>, b: Record<string, any>) => {
      const valA = a[f.key];
      const valB = b[f.key];
      if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
      return String(valA ?? '').localeCompare(String(valB ?? ''));
    },
  }));

  return (
    <div>
      <Card title="SQL 查询" size="small">
        <Editor
          height="200px"
          defaultLanguage="sql"
          value={sql}
          onChange={(value) => setSql(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlayCircleOutlined />} loading={loading} onClick={handleExecute}>
            执行
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => { setSql(''); setResult(null); }}>
            清空
          </Button>
          {result && (
            <Button icon={<ExportOutlined />} onClick={handleExportCSV}>
              导出 CSV
            </Button>
          )}
        </Space>
      </Card>

      {result && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="结果表格" size="small">
              <Table
                dataSource={rows}
                columns={columns}
                size="small"
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="时序曲线" size="small">
              {hasTime ? (
                <TimeSeriesChart
                  title={sql}
                  xAxisData={result.timestamps}
                  series={fields
                    .filter((f) => f.key !== '__time')
                    .map((f) => ({ name: f.title, data: rows.map((row) => row[f.key]) }))}
                  height={400}
                />
              ) : (
                <Empty description="结果没有时间轴，无法绘制时序曲线" />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Query;
