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
import { App as AntdApp, Alert, Button, Card, Select, Space, Spin, Table, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { queryRows } from '../../services/rest';
import type { LineageNode } from '../../types/api';

/** Tree paths are interpolated raw into `SHOW … **`, so keep them to path characters. */
const PATH = /^[A-Za-z0-9_.]+$/;

const describe = (err: any): string => err.response?.data?.message || err.message || '请求失败';

const kindColor = (kind: LineageNode['kind']): string =>
  (({ DATABASE: 'geekblue', NODE: 'default', DEVICE: 'green', MEASUREMENT: 'orange' }) as const)[kind];

/**
 * Walk the device path segment by segment: the levels that own no device and no timeseries of their own
 * (`tenant_000000` in `root.db.tenant_000000.item_42`) still have to appear, or the tree loses a level.
 */
const descend = (root: LineageNode, path: string): LineageNode => {
  const segments = path.split('.');
  let current = root;
  segments.forEach((segment, index) => {
    const key = segments.slice(0, index + 1).join('.');
    const children = current.children ?? (current.children = []);
    let next = children.find((node) => node.key === key);
    if (!next) {
      next = { key, title: segment, kind: 'NODE' };
      children.push(next);
    }
    current = next;
  });
  return current;
};

const buildLineage = (
  database: string,
  devices: Record<string, any>[],
  timeseries: Record<string, any>[],
): LineageNode => {
  const root: LineageNode = { key: database, title: database, kind: 'DATABASE', children: [] };
  devices.forEach((device) => {
    const path = String(device.Device ?? '');
    if (!path.startsWith(`${database}.`)) return;
    const node = descend(root, path.slice(database.length + 1));
    node.kind = 'DEVICE';
    const template = device.Template ? `模板 ${device.Template}` : '';
    node.detail = [template, device.IsAligned === 'true' ? '对齐' : '', device['TTL(ms)']]
      .filter(Boolean)
      .join(' · ');
  });
  timeseries.forEach((series) => {
    const path = String(series.Timeseries ?? '');
    const parent = path.slice(0, path.lastIndexOf('.'));
    if (!path.startsWith(`${database}.`) || !parent.startsWith(`${database}.`)) return;
    const detail = [series.DataType, series.ViewType === 'BASE' ? '' : `视图 ${series.ViewType}`]
      .filter(Boolean)
      .join(' · ');
    const measurement = descend(root, path.slice(database.length + 1));
    measurement.kind = 'MEASUREMENT';
    measurement.detail = detail;
    const device = descend(root, parent.slice(database.length + 1));
    if (device.kind === 'NODE') device.kind = 'DEVICE';
  });
  return root;
};

/** antd only expands on first render, so drive the expansion itself to keep a reloaded tree open. */
const collapsibleKeys = (nodes: LineageNode[]): string[] =>
  nodes.flatMap((node) => (node.children?.length ? [node.key, ...collapsibleKeys(node.children)] : []));

const LineageAnalysis: React.FC = () => {
  const [databases, setDatabases] = useState<string[]>([]);
  const [database, setDatabase] = useState('');
  const [tree, setTree] = useState<LineageNode[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { message } = AntdApp.useApp();

  useEffect(() => {
    queryRows('SHOW DATABASES')
      .then((rows) => {
        const list = rows.map((row) => String(row.Database ?? '')).filter((item) => PATH.test(item));
        setDatabases(list);
        setDatabase((current) => current || list[0] || '');
      })
      .catch((err) => setError(describe(err)));
  }, []);

  const fetchLineage = async (db: string) => {
    if (!db || !PATH.test(db)) return;
    setLoading(true);
    try {
      const [devices, timeseries] = await Promise.all([
        queryRows(`SHOW DEVICES ${db}.**`),
        queryRows(`SHOW TIMESERIES ${db}.**`),
      ]);
      const lineage = [buildLineage(db, devices, timeseries)];
      setTree(lineage);
      setExpanded(collapsibleKeys(lineage));
      setError('');
    } catch (err: any) {
      setTree([]);
      const detail = describe(err);
      setError(detail);
      message.error(`获取血缘失败: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (database) fetchLineage(database);
  }, [database]);

  return (
    <div>
      <Card
        title="Schema 血缘分析"
        size="small"
        extra={
          <Space>
            <Select
              style={{ width: 220 }}
              value={database || undefined}
              placeholder="数据库"
              onChange={setDatabase}
              options={databases.map((item) => ({ label: item, value: item }))}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchLineage(database)}>
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title="无法读取 Schema 结构" description={error} />
          ) : (
            <Table<LineageNode>
              dataSource={tree}
              rowKey="key"
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
              expandable={{
                expandedRowKeys: expanded,
                onExpandedRowsChange: (keys) => setExpanded(keys as string[]),
              }}
              columns={[
                { title: '路径', dataIndex: 'title', key: 'title' },
                {
                  title: '层级',
                  dataIndex: 'kind',
                  key: 'kind',
                  width: 120,
                  render: (kind: LineageNode['kind']) => <Tag color={kindColor(kind)}>{kind}</Tag>,
                },
                { title: '来源 / 属性', dataIndex: 'detail', key: 'detail' },
              ]}
              locale={{
                emptyText: (
                  <Alert
                    type="info"
                    showIcon
                    title="该数据库下没有设备或测点"
                    description="查询成功，但 SHOW DEVICES 与 SHOW TIMESERIES 都没有返回行。血缘由这两个语句拼装而成，IoTDB 没有 SHOW LINEAGE 这类语句。"
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

export default LineageAnalysis;
