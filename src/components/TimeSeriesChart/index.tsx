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

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface TimeSeriesChartProps {
  title: string;
  xAxisData: number[];
  series: { name: string; data: any[] }[];
  height?: number;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ title, xAxisData, series, height = 400 }) => {
  const option = {
    title: { text: title, left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let result = `Time: ${params[0].axisValue}<br/>`;
        params.forEach((param: any) => {
          result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
        });
        return result;
      },
    },
    legend: { data: series.map((s) => s.name), top: 30 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLabel: { formatter: (val: number) => new Date(val).toLocaleTimeString() },
    },
    yAxis: { type: 'value' },
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      sampling: 'lttb',
      showSymbol: false,
    })),
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, height: 20 },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
};

export default TimeSeriesChart;
