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

import React, { useEffect, useRef, useState } from 'react';
import {
  App as AntdApp,
  Alert,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Row,
  Spin,
  Table,
  Tag,
  Tooltip,
  Tree,
  Typography,
} from 'antd';
import {
  ApartmentOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  HddOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { query, queryRows } from '../../services/rest';
import { normalizeDevicePath } from '../../utils/path';
import { humanSpan } from '../../utils/analysis';
import { formatTimestamp } from '../../utils/formatter';
import { shapeResult } from '../../utils/queryResult';
import type { ShapedResult } from '../../utils/queryResult';
import type { TreeDataNode } from 'antd';

const { Search } = Input;
const { Text } = Typography;

const SERIES_LIMIT = 200;
const PREVIEW_LIMIT = 20;

type NodeKind = 'DATABASE' | 'DEVICE' | 'TIMESERIES' | 'INTERNAL';

const KIND_META: Record<NodeKind, { label: string; color: string; icon: React.ReactNode }> = {
  DATABASE: { label: '数据库', color: 'blue', icon: <DatabaseOutlined /> },
  DEVICE: { label: '设备', color: 'cyan', icon: <HddOutlined /> },
  TIMESERIES: { label: '时间序列', color: 'green', icon: <FieldTimeOutlined /> },
  INTERNAL: { label: '内部节点', color: 'default', icon: <ApartmentOutlined /> },
};

interface TreeNode extends TreeDataNode {
  key: string;
  kind: NodeKind;
  children?: TreeNode[];
}

interface ChildRef {
  path: string;
  name: string;
  kind: NodeKind;
}

interface NodeInfo {
  path: string;
  kind: NodeKind;
  database: string;
  children: ChildRef[];
  /** The exact `SHOW TIMESERIES <path>` row, i.e. the schema of a leaf node. */
  own?: Record<string, any>;
  series: Record<string, any>[];
  seriesTruncated: boolean;
  device?: Record<string, any>;
  seriesCount?: number;
  deviceCount?: number;
  latest?: ShapedResult;
  preview?: ShapedResult;
  dbAttr?: Record<string, any>;
}

interface SearchHit {
  path: string;
  rows: Record<string, any>[];
  truncated: boolean;
}

const PLAIN_NODE = /^[A-Za-z][A-Za-z0-9_]*$/;

// Node names that are reserved words (time) or carry other characters have to reach the parser
// backquoted; the live node accepts a fully backquoted path, so quoting per segment is always safe.
const quoteNode = (name: string): string => (PLAIN_NODE.test(name) ? name : `\`${name}\``);
const sqlPath = (path: string): string => path.split('.').map(quoteNode).join('.');

const childName = (path: string): string => path.slice(path.lastIndexOf('.') + 1);

// NodeTypes is server text, and an unrecognised value must not take the page down on `KIND_META[...]`.
const kindOf = (value: unknown): NodeKind =>
  value === 'DATABASE' || value === 'DEVICE' || value === 'TIMESERIES' ? value : 'INTERNAL';

const toChildRefs = (rows: Record<string, any>[]): ChildRef[] =>
  rows.map((row) => {
    const path = String(row.ChildPaths);
    return { path, name: childName(path), kind: kindOf(row.NodeTypes) };
  });

const toTreeNodes = (children: ChildRef[]): TreeNode[] =>
  children.map((child) => ({
    key: child.path,
    title: child.name,
    kind: child.kind,
    isLeaf: child.kind === 'TIMESERIES',
    icon: KIND_META[child.kind].icon,
  }));

const attachChildren = (nodes: TreeNode[], key: string, children: TreeNode[]): TreeNode[] =>
  nodes.map((node) => {
    if (node.key === key) {
      return { ...node, children, isLeaf: children.length === 0 };
    }
    if (node.children) {
      return { ...node, children: attachChildren(node.children, key, children) };
    }
    return node;
  });

const reasons = (settled: PromiseSettledResult<any>[]): string[] =>
  settled
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map((r) => r.reason?.message || String(r.reason));

const jsonPairs = (value: any): string => {
  if (!value) return '-';
  try {
    const parsed = JSON.parse(String(value));
    const pairs = Object.entries(parsed).map(([k, v]) => `${k}=${v}`);
    return pairs.length ? pairs.join(', ') : '-';
  } catch {
    return String(value);
  }
};

/** Column headers of a device-scoped SELECT carry the whole path; only the tail differs per column. */
const trimmedFields = (shaped: ShapedResult, prefix: string): ShapedResult['fields'] =>
  shaped.fields.map((field) => ({
    ...field,
    title: field.title.startsWith(`${prefix}.`) ? field.title.slice(prefix.length + 1) : field.title,
  }));

const shapedColumns = (fields: ShapedResult['fields']) =>
  fields.map((field) => ({
    title: field.title,
    dataIndex: field.key,
    key: field.key,
    render: (value: any) => {
      if (value === null || value === undefined || value === '') return '-';
      return field.key === '__time' ? formatTimestamp(Number(value)) : String(value);
    },
  }));

const shapeFrom = (result: any, prefix: string): ShapedResult => {
  const shaped = shapeResult(result);
  return { ...shaped, fields: trimmedFields(shaped, prefix) };
};

const Explorer: React.FC = () => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [databases, setDatabases] = useState<Record<string, any>[]>([]);
  const [info, setInfo] = useState<NodeInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoErrors, setInfoErrors] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [hits, setHits] = useState<SearchHit | null>(null);
  const loaded = useRef<Set<string>>(new Set());
  const { message } = AntdApp.useApp();

  const loadChildren = async (parent: string): Promise<ChildRef[]> => toChildRefs(
    await queryRows(`SHOW CHILD PATHS ${sqlPath(parent)}`)
  );

  /** Make sure the branch above `path` is in the tree, so the node is visible and highlighted. */
  const reveal = async (path: string) => {
    const segments = path.split('.');
    const ancestors: string[] = [];
    for (let i = 1; i < segments.length; i += 1) {
      ancestors.push(segments.slice(0, i + 1).join('.'));
    }
    const chain = ancestors.slice(0, -1);
    for (const parent of chain) {
      if (loaded.current.has(parent)) continue;
      loaded.current.add(parent);
      const children = await loadChildren(parent);
      setTreeData((prev) => attachChildren(prev, parent, toTreeNodes(children)));
    }
    setExpandedKeys((prev) => Array.from(new Set([...prev, ...chain])));
  };

  const fetchInfo = async (path: string) => {
    setInfoLoading(true);
    setInfoErrors([]);
    // A failed read must not leave the previous node's numbers on screen under the new path.
    setInfo(null);
    const target = sqlPath(path);
    const [childSettled, ownSettled, underSettled, deviceSettled] = await Promise.allSettled([
      queryRows(`SHOW CHILD PATHS ${target}`),
      queryRows(`SHOW TIMESERIES ${target} LIMIT 1`),
      queryRows(`SHOW TIMESERIES ${target}.** LIMIT ${SERIES_LIMIT + 1}`),
      queryRows(`SHOW DEVICES ${target} LIMIT 1`),
    ]);
    const errors = reasons([childSettled, ownSettled, underSettled, deviceSettled]);
    const children = childSettled.status === 'fulfilled' ? toChildRefs(childSettled.value) : [];
    const ownRow = ownSettled.status === 'fulfilled' ? ownSettled.value[0] : undefined;
    const deviceRow = deviceSettled.status === 'fulfilled' ? deviceSettled.value[0] : undefined;
    const underRows = underSettled.status === 'fulfilled' ? underSettled.value : [];
    const kind: NodeKind = ownRow
      ? 'TIMESERIES'
      : deviceRow
        ? 'DEVICE'
        : databases.some((db) => db.Database === path)
          ? 'DATABASE'
          : 'INTERNAL';
    const dbAttr = databases.find((db) => db.Database === path);
    const owners = databases
      .map((db) => String(db.Database))
      .filter((db) => path === db || path.startsWith(`${db}.`))
      .sort((a, b) => b.length - a.length);

    // A leaf counts as nothing under itself and a device has no devices under it, so both counts
    // would read as a misleading 0; ask only where the answer means something.
    const device = path.slice(0, path.lastIndexOf('.')) || 'root';
    const measurement = quoteNode(childName(path));
    const jobs: { label: string; run: () => Promise<any> }[] = [];
    if (kind !== 'TIMESERIES') {
      jobs.push({ label: 'seriesCount', run: () => queryRows(`COUNT TIMESERIES ${target}.**`) });
    }
    if (kind === 'DATABASE' || kind === 'INTERNAL') {
      jobs.push({ label: 'deviceCount', run: () => queryRows(`COUNT DEVICES ${target}.**`) });
    }
    if (kind === 'DEVICE') {
      jobs.push({ label: 'latest', run: () => query(`SELECT LAST * FROM ${target}`) });
      jobs.push({
        label: 'preview',
        run: () => query(`SELECT * FROM ${target} ORDER BY time DESC LIMIT ${PREVIEW_LIMIT}`),
      });
    }
    if (kind === 'TIMESERIES') {
      jobs.push({
        label: 'preview',
        run: () => query(`SELECT ${measurement} FROM ${sqlPath(device)} ORDER BY time DESC LIMIT ${PREVIEW_LIMIT}`),
      });
    }
    const extra = await Promise.allSettled(jobs.map((job) => job.run()));
    errors.push(...reasons(extra));
    const pick = (label: string): any => {
      const index = jobs.findIndex((job) => job.label === label);
      const settled = index >= 0 ? extra[index] : undefined;
      return settled?.status === 'fulfilled' ? settled.value : undefined;
    };
    const asCount = (rows: any, column: string): number | undefined => {
      const value = rows?.[0]?.[column];
      return typeof value === 'number' ? value : undefined;
    };
    const latestResult = pick('latest');
    const previewResult = pick('preview');

    setInfo({
      path,
      kind,
      database: owners[0] || '',
      children,
      own: ownRow,
      series: underRows.slice(0, SERIES_LIMIT),
      seriesTruncated: underRows.length > SERIES_LIMIT,
      device: deviceRow,
      seriesCount: asCount(pick('seriesCount'), 'count(timeseries)'),
      deviceCount: asCount(pick('deviceCount'), 'count(devices)'),
      dbAttr,
      latest: latestResult ? shapeFrom(latestResult, path) : undefined,
      preview: previewResult ? shapeFrom(previewResult, kind === 'TIMESERIES' ? device : path) : undefined,
    });
    setInfoLoading(false);
  };

  const selectNode = async (path: string, expand = false) => {
    setSelectedKeys([path]);
    setSearchValue('');
    setHits(null);
    if (expand) {
      try {
        await reveal(path);
      } catch (error: any) {
        message.warning(`展开路径失败: ${error.message}`);
      }
    }
    fetchInfo(path);
  };

  const refreshTree = async () => {
    setTreeLoading(true);
    loaded.current = new Set();
    try {
      const [children, dbRows] = await Promise.all([loadChildren('root'), queryRows('SHOW DATABASES')]);
      loaded.current.add('root');
      setDatabases(dbRows);
      setTreeData([
        {
          key: 'root',
          title: 'root',
          kind: 'INTERNAL',
          icon: KIND_META.INTERNAL.icon,
          children: toTreeNodes(children),
        },
      ]);
    } catch (error: any) {
      message.error(`加载路径失败: ${error.message}`);
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    refreshTree();
  }, []);

  const onLoadData = async (node: TreeDataNode) => {
    const key = String(node.key);
    if (loaded.current.has(key)) return;
    try {
      loaded.current.add(key);
      const children = await loadChildren(key);
      setTreeData((prev) => attachChildren(prev, key, toTreeNodes(children)));
    } catch (error: any) {
      loaded.current.delete(key);
      message.error(`加载子节点失败: ${error.message}`);
    }
  };

  const onSearch = async () => {
    const raw = searchValue.trim();
    if (!raw) {
      setHits(null);
      return;
    }
    const path = normalizeDevicePath(raw);
    if (!path) {
      message.warning('请输入 root. 开头的路径（末尾的 .* / .** 会被当作整棵子树）');
      return;
    }
    setTreeLoading(true);
    try {
      const rows = await queryRows(`SHOW TIMESERIES ${sqlPath(path)}.** LIMIT ${SERIES_LIMIT + 1}`);
      setHits({ path, rows, truncated: rows.length > SERIES_LIMIT });
      if (!rows.length) message.info('没有匹配的时间序列');
    } catch (error: any) {
      message.error(`搜索失败: ${error.message}`);
    } finally {
      setTreeLoading(false);
    }
  };

  const seriesTable = (rows: Record<string, any>[], prefix: string) => (
    <Table
      size="small"
      rowKey={(row) => String(row.Timeseries)}
      dataSource={rows}
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: 'max-content' }}
      columns={[
        {
          title: '时间序列',
          dataIndex: 'Timeseries',
          key: 'Timeseries',
          // Measurement alone is ambiguous as soon as several devices are in scope, so the label
          // keeps every level below the node or search path that was asked about.
          render: (value: string) => (
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => selectNode(String(value), true)}
            >
              {String(value).startsWith(`${prefix}.`) ? value.slice(prefix.length + 1) : value}
            </Button>
          ),
        },
        { title: '数据类型', dataIndex: 'DataType', key: 'DataType' },
        { title: '编码', dataIndex: 'Encoding', key: 'Encoding' },
        { title: '压缩', dataIndex: 'Compression', key: 'Compression' },
        {
          title: '标签',
          dataIndex: 'Tags',
          key: 'Tags',
          render: (value: any) => (
            <Tooltip title={jsonPairs(value)}>
              <span>{jsonPairs(value)}</span>
            </Tooltip>
          ),
        },
      ]}
    />
  );

  const baseItems = (node: NodeInfo) => {
    const items: { label: string; children: React.ReactNode }[] = [
      { label: '节点类型', children: <Tag color={KIND_META[node.kind].color}>{KIND_META[node.kind].label}</Tag> },
      { label: '所属数据库', children: node.database || '-' },
      { label: '子节点', children: node.children.length },
    ];
    if (node.kind === 'TIMESERIES') {
      items.push(
        { label: '数据类型', children: node.own?.DataType },
        { label: '编码', children: node.own?.Encoding },
        { label: '压缩', children: node.own?.Compression },
        { label: '别名', children: node.own?.Alias || '-' },
        { label: '视图类型', children: node.own?.ViewType || '-' },
        { label: '死区', children: `${node.own?.Deadband || '-'} ${node.own?.DeadbandParameters || ''}`.trim() },
        { label: '标签', children: jsonPairs(node.own?.Tags) },
        { label: '属性', children: jsonPairs(node.own?.Attributes) }
      );
    }
    if (node.kind === 'DEVICE') {
      items.push(
        { label: '时间序列数', children: node.seriesCount ?? '-' },
        { label: '对齐存储', children: node.device?.IsAligned ?? '-' },
        { label: '模板', children: node.device?.Template || '-' },
        // TTL comes back as the literal string INF when no TTL is set, so it cannot be read as a number.
        { label: 'TTL', children: node.device?.['TTL(ms)'] ?? '-' }
      );
    }
    if (node.kind === 'DATABASE' || node.kind === 'INTERNAL') {
      items.push(
        { label: '时间序列数', children: node.seriesCount ?? '-' },
        { label: '设备数', children: node.deviceCount ?? '-' }
      );
      if (node.kind === 'DATABASE') {
        items.push(
          { label: 'Schema 副本因子', children: node.dbAttr?.SchemaReplicationFactor ?? '-' },
          { label: 'Data 副本因子', children: node.dbAttr?.DataReplicationFactor ?? '-' },
          { label: '时间分区间隔', children: humanSpan(Number(node.dbAttr?.TimePartitionInterval) || 0) }
        );
      }
    }
    return items;
  };

  return (
    <Row gutter={16}>
      <Col xs={24} lg={8}>
        <Card
          title="路径树"
          size="small"
          extra={
            <Button icon={<ReloadOutlined />} size="small" onClick={refreshTree}>
              刷新
            </Button>
          }
        >
          <Search
            placeholder="搜索路径，如 root.sg 或 root.sg.**"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={onSearch}
            enterButton
            style={{ marginBottom: 16 }}
          />
          <Spin spinning={treeLoading}>
            <Tree
              showIcon
              blockNode
              height={560}
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              loadData={onLoadData}
              onExpand={(keys) => setExpandedKeys(keys)}
              onSelect={(keys) => {
                setSelectedKeys(keys);
                if (keys.length) fetchInfo(String(keys[0]));
              }}
            />
          </Spin>
        </Card>
      </Col>

      <Col xs={24} lg={16}>
        {hits && (
          <Card
            title={`搜索结果：${hits.path}.** (${hits.rows.length})`}
            size="small"
            style={{ marginBottom: 16 }}
            extra={<Button size="small" onClick={() => setHits(null)}>关闭</Button>}
          >
            {hits.truncated && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 8 }}
                title={`命中超过 ${SERIES_LIMIT} 条，只显示前 ${SERIES_LIMIT} 条`}
              />
            )}
            {seriesTable(hits.rows, hits.path)}
          </Card>
        )}

        <Card
          title="节点信息"
          size="small"
          extra={
            info && (
              <Button size="small" icon={<ReloadOutlined />} onClick={() => fetchInfo(info.path)}>
                重新读取
              </Button>
            )
          }
        >
          <Spin spinning={infoLoading}>
            {!info ? (
              <Empty description="点击左侧树中的节点查看其信息" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <Breadcrumb
                    items={info.path.split('.').map((name, i, all) => {
                      const ancestor = all.slice(0, i + 1).join('.');
                      const current = i === all.length - 1;
                      return {
                        title: current ? (
                          name
                        ) : (
                          <Button type="link" size="small" style={{ padding: 0 }} onClick={() => selectNode(ancestor, true)}>
                            {name}
                          </Button>
                        ),
                      };
                    })}
                  />
                  <Text copyable style={{ wordBreak: 'break-all' }}>
                    {info.path}
                  </Text>
                </div>

                {infoErrors.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    title="部分信息读取失败"
                    description={infoErrors.join('；')}
                  />
                )}

                <Descriptions bordered size="small" column={2} items={baseItems(info)} />

                {info.children.length > 0 && (
                  <div>
                    <Text strong>子节点</Text>
                    <Table
                      size="small"
                      rowKey={(row) => row.path}
                      dataSource={info.children}
                      pagination={{ pageSize: 10, hideOnSinglePage: true }}
                      scroll={{ x: 'max-content' }}
                      onRow={(row) => ({ onClick: () => selectNode(row.path, true), style: { cursor: 'pointer' } })}
                      columns={[
                        { title: '名称', dataIndex: 'name', key: 'name' },
                        {
                          title: '类型',
                          dataIndex: 'kind',
                          key: 'kind',
                          render: (kind: NodeKind) => (
                            <Tag color={KIND_META[kind].color}>{KIND_META[kind].label}</Tag>
                          ),
                        },
                        { title: '完整路径', dataIndex: 'path', key: 'path' },
                      ]}
                    />
                  </div>
                )}

                {info.kind !== 'TIMESERIES' && info.series.length > 0 && (
                  <div>
                    <Text strong>
                      下属时间序列 {info.seriesCount !== undefined ? `(${info.seriesCount})` : ''}
                    </Text>
                    {info.seriesTruncated && (
                      <Text type="secondary">（仅显示前 {SERIES_LIMIT} 条）</Text>
                    )}
                    {seriesTable(info.series, info.path)}
                  </div>
                )}

                {info.latest && (
                  <div>
                    <Text strong>最新值</Text>
                    <Table
                      size="small"
                      rowKey="key"
                      dataSource={info.latest.rows}
                      columns={shapedColumns(info.latest.fields)}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                )}

                {info.preview && (
                  <div>
                    <Text strong>最近 {PREVIEW_LIMIT} 行数据</Text>
                    <Table
                      size="small"
                      rowKey="key"
                      dataSource={info.preview.rows}
                      columns={shapedColumns(info.preview.fields)}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      locale={{ emptyText: '该节点暂无数据行' }}
                    />
                  </div>
                )}
              </div>
            )}
          </Spin>
        </Card>
      </Col>
    </Row>
  );
};

export default Explorer;
