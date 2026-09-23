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
import { shapeResult, toChartSeries, chartTitleOf } from '../../utils/queryResult';
import type { Field } from '../../utils/queryResult';
import { useI18n } from '../../i18n';

const Query: React.FC = () => {
  const { t } = useI18n();
  const [sql, setSql] = useState('SELECT s1, s2 FROM root.sg.d1 LIMIT 100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const { addHistory } = useQueryStore();
  const { message } = AntdApp.useApp();

  const handleExecute = useCallback(async () => {
    if (!sql.trim()) {
      message.warning(t('请输入 SQL 语句'));
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
      message.success(t('查询成功，返回 {n} 行', { n: rowCount }));
    } catch (error: any) {
      message.error(t('查询失败: {reason}', { reason: error.response?.data?.message || error.message }));
    } finally {
      setLoading(false);
    }
  }, [sql, addHistory, message, t]);

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
      <Card title={t('SQL 查询')} size="small">
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
            {t('执行')}
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => { setSql(''); setResult(null); }}>
            {t('清空')}
          </Button>
          {result && (
            <Button icon={<ExportOutlined />} onClick={handleExportCSV}>
              {t('导出 CSV')}
            </Button>
          )}
        </Space>
      </Card>

      {result && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title={t('结果表格')} size="small">
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
            <Card title={t('时序曲线')} size="small">
              {hasTime ? (
                <TimeSeriesChart
                  title={chartTitleOf(sql)}
                  xAxisData={result.timestamps}
                  series={toChartSeries({ fields, rows, hasTime }, sql)}
                  height={400}
                />
              ) : (
                <Empty description={t('结果没有时间轴，无法绘制时序曲线')} />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Query;
