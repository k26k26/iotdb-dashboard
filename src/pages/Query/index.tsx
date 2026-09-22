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

import React, { useState, useCallback } from 'react';
import { Card, Button, Space, Table, message, Row, Col } from 'antd';
import { PlayCircleOutlined, ExportOutlined, ClearOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { query } from '../../services/rest';
import { useQueryStore } from '../../stores/query';
import type { QueryResult } from '../../types/api';
import TimeSeriesChart from '../../components/TimeSeriesChart';

const Query: React.FC = () => {
  const [sql, setSql] = useState('SELECT s1, s2 FROM root.sg.d1 LIMIT 100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const { addHistory } = useQueryStore();

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
      addHistory({
        id: Date.now().toString(),
        sql,
        timestamp: Date.now(),
        duration,
        rowCount: res.timestamps.length,
      });
      message.success(`查询成功，返回 ${res.timestamps.length} 行`);
    } catch (error: any) {
      message.error(`查询失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [sql, addHistory]);

  const handleExportCSV = () => {
    if (!result) return;
    const headers = result.column_names.join(',');
    const values = Array.isArray(result?.values) ? result.values : [];
    const rows = result.timestamps.map((ts, i) => {
      const rowValues = values[i] ? values[i].map((v) => `"${v}"`).join(',') : '';
      return `${ts},${rowValues}`;
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `query_result_${Date.now()}.csv`;
    link.click();
  };

  const columns = result
    ? result.column_names.map((col) => ({
        title: col,
        dataIndex: col,
        key: col,
        sorter: (a: any, b: any) => {
          const valA = a[col];
          const valB = b[col];
          if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
          return String(valA).localeCompare(String(valB));
        },
      }))
    : [];

  const dataSource = result
    ? result.timestamps.map((ts, i) => {
        const values = Array.isArray(result?.values) ? result.values : [];
        return {
          key: ts,
          ...result.column_names.reduce((acc, col, j) => {
            acc[col] = j === 0 ? ts : values[i]?.[j - 1];
            return acc;
          }, {} as Record<string, any>),
        };
      })
    : [];

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
                dataSource={dataSource}
                columns={columns}
                size="small"
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 20 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="时序曲线" size="small">
              <TimeSeriesChart
                title={sql}
                xAxisData={result.timestamps}
                series={result.column_names
                  .slice(1)
                  .map((name, i) => {
                    const values = Array.isArray(result?.values) ? result.values : [];
                    return { name, data: values.map((v) => v[i]) };
                  })}
                height={400}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Query;
