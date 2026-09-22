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

import React, { useMemo, useState } from 'react';
import { App as AntdApp, Card, Button, Space, Row, Col, Input, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import TimeSeriesChart from '../../components/TimeSeriesChart';
import { query, assertRestOk } from '../../services/rest';
import { shapeResult, toChartSeries, chartTitleOf } from '../../utils/queryResult';
import type { QueryResult } from '../../types/api';

interface ChartConfig {
  id: string;
  sql: string;
  title: string;
  data: QueryResult | null;
}

const ChartPanel: React.FC<{ chart: ChartConfig }> = ({ chart }) => {
  const shaped = useMemo(() => shapeResult(chart.data), [chart.data]);
  const series = useMemo(() => toChartSeries(shaped, chart.sql), [shaped, chart.sql]);

  if (!chart.data) return null;
  if (shaped.rows.length === 0) {
    return <Empty description="查询没有返回数据，请确认路径与设备是否存在" />;
  }
  if (!shaped.hasTime) return <Empty description="结果没有时间轴，无法绘制时序曲线" />;
  if (series.length === 0) return <Empty description="查询没有返回数值列" />;

  return (
    <TimeSeriesChart
      title={chartTitleOf(chart.sql)}
      xAxisData={chart.data.timestamps}
      series={series}
      height={300}
    />
  );
};

const Visualization: React.FC = () => {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [newSql, setNewSql] = useState('SELECT s1 FROM root.sg.d1 LIMIT 100');
  const [newTitle, setNewTitle] = useState('新图表');
  const [adding, setAdding] = useState(false);
  const { message } = AntdApp.useApp();

  const handleAddChart = async () => {
    if (!newSql.trim()) {
      message.warning('请输入 SQL 语句');
      return;
    }
    setAdding(true);
    try {
      const data = await query(newSql);
      assertRestOk(data);
      setCharts([
        ...charts,
        { id: Date.now().toString(), sql: newSql, title: newTitle, data },
      ]);
      message.success('图表添加成功');
    } catch (error: any) {
      message.error(`查询失败: ${error.response?.data?.message || error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveChart = (id: string) => {
    setCharts(charts.filter((c) => c.id !== id));
  };

  return (
    <div>
      <Card title="可视化看板" size="small">
        <Space align="start">
          <Input
            placeholder="图表标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ width: 200 }}
          />
          <Input.TextArea
            placeholder="输入 SQL"
            value={newSql}
            onChange={(e) => setNewSql(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 4 }}
            style={{ width: 400 }}
          />
          <Button type="primary" icon={<PlusOutlined />} loading={adding} onClick={handleAddChart}>
            添加图表
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {charts.map((chart) => (
          <Col xs={24} lg={12} key={chart.id}>
            <Card
              title={chart.title}
              size="small"
              extra={
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveChart(chart.id)}
                />
              }
            >
              <ChartPanel chart={chart} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Visualization;
