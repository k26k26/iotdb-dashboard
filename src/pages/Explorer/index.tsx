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
import { Card, Tree, Input, Spin, Button, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { node } from '../../services/grafana';
import { query } from '../../services/rest';

const { Search } = Input;

interface TreeNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  children?: TreeNode[];
}

const Explorer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const loadNodes = async (paths: string[]): Promise<TreeNode[]> => {
    try {
      const children = await node(paths);
      return children.map((path: string) => {
        const parts = path.split('.');
        const name = parts[parts.length - 1];
        return {
          title: name,
          key: path,
          isLeaf: false,
        };
      });
    } catch (error) {
      console.error('Failed to load nodes:', error);
      return [];
    }
  };

  const onLoadData = async ({ key }: { key: string }) => {
    setLoading(true);
    const children = await loadNodes([key]);
    setTreeData((prev) => {
      const updateTree = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((node) => {
          if (node.key === key) {
            return { ...node, children, isLeaf: children.length === 0 };
          }
          if (node.children) {
            return { ...node, children: updateTree(node.children) };
          }
          return node;
        });
      };
      return updateTree(prev);
    });
    setLoading(false);
  };

  const onSelect = (_selectedKeys: React.Key[]) => {
    // 选中节点后可扩展数据预览
  };

  const onSearch = async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    try {
      await query(`SHOW TIMESERIES ${searchValue}`);
      message.success('搜索完成');
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initTree = async () => {
      setLoading(true);
      const rootNodes = await loadNodes(['root']);
      setTreeData(rootNodes);
      setLoading(false);
    };
    initTree();
  }, []);

  return (
    <div>
      <Card title="路径浏览器" size="small" extra={<Button icon={<ReloadOutlined />}>刷新</Button>}>
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