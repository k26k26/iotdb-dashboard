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

import React, { useState } from 'react';
import { Card, Button, Space, message, Row, Col, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import TimeSeriesChart from '../../components/TimeSeriesChart';
import { query } from '../../services/rest';
import type { QueryResult } from '../../types/api';

interface ChartConfig {
  id: string;
  sql: string;
  title: string;
  data: QueryResult | null;
}

const Visualization: React.FC = () => {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [newSql, setNewSql] = useState('SELECT s1 FROM root.sg.d1 LIMIT 100');
  const [newTitle, setNewTitle] = useState('新图表');

  const handleAddChart = async () => {
    try {
      const data = await query(newSql);
      const newChart: ChartConfig = {
        id: Date.now().toString(),
        sql: newSql,
        title: newTitle,
        data,
      };
      setCharts([...charts, newChart]);
      message.success('图表添加成功');
    } catch (error: any) {
      message.error(`查询失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRemoveChart = (id: string) => {
    setCharts(charts.filter((c) => c.id !== id));
  };

  return (
    <div>
      <Card title="可视化看板" size="small">
        <Space>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddChart}>
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
              {chart.data && (
                <TimeSeriesChart
                  title={chart.sql}
                  xAxisData={chart.data.timestamps}
                  series={chart.data.column_names
                    .slice(1)
                    .map((name, i) => {
                      const values = Array.isArray(chart.data?.values) ? chart.data.values : [];
                      return { name, data: values.map((v) => v[i]) };
                    })}
                  height={300}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Visualization;
