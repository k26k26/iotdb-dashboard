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
import { App as AntdApp, Card, Tree, Input, Spin, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query, assertRestOk } from '../../services/rest';

const { Search } = Input;

const ROOT_PATH = 'root';

interface TreeNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: TreeNode[];
}

// SHOW CHILD NODES reports the child names, so the full path has to be rebuilt here —
// feeding a bare name back in is a parse error on the server.
const loadChildren = async (parent: string): Promise<TreeNode[]> => {
  const result = await query(`SHOW CHILD NODES ${parent}`);
  assertRestOk(result);
  const names = Array.isArray(result.values) && Array.isArray(result.values[0]) ? result.values[0] : [];
  return names.map((name) => ({
    title: String(name),
    key: `${parent}.${name}`,
    isLeaf: false,
  }));
};

const Explorer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const { message } = AntdApp.useApp();

  const refresh = async () => {
    setLoading(true);
    try {
      setTreeData(await loadChildren(ROOT_PATH));
    } catch (error: any) {
      message.error(`加载路径失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onLoadData = async ({ key }: { key: React.Key }) => {
    setLoading(true);
    try {
      const children = await loadChildren(String(key));
      setTreeData((prev) => {
        const update = (nodes: TreeNode[]): TreeNode[] =>
          nodes.map((node) => {
            if (node.key === key) {
              return { ...node, children, isLeaf: children.length === 0 };
            }
            if (node.children) {
              return { ...node, children: update(node.children) };
            }
            return node;
          });
        return update(prev);
      });
    } catch (error: any) {
      message.error(`加载子节点失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onSelect = (_selectedKeys: React.Key[]) => {
    // 选中节点后可扩展数据预览
  };

  const onSearch = async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    try {
      const result = await query(`SHOW TIMESERIES ${searchValue}`);
      assertRestOk(result);
      const count = Array.isArray(result.values) && Array.isArray(result.values[0]) ? result.values[0].length : 0;
      message.success(count ? `找到 ${count} 条时间序列` : '没有找到匹配的时间序列');
    } catch (error: any) {
      message.error(`搜索失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card title="路径浏览器" size="small" extra={<Button icon={<ReloadOutlined />} onClick={refresh}>刷新</Button>}>
        <Search
          placeholder="搜索路径..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onSearch={onSearch}
          style={{ width: 300, marginBottom: 16 }}
        />
        <Spin spinning={loading}>
          <Tree
            showIcon
            loadData={onLoadData}
            onSelect={onSelect}
            treeData={treeData}
            height={400}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default Explorer;
