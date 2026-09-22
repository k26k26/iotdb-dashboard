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
import { Card, Table, Button, message, Spin, Alert, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';

interface LineageNode {
  name: string;
  type: 'TEMPLATE' | 'DEVICE' | 'TIMESERIES';
  children: LineageNode[];
}

const LineageAnalysis: React.FC = () => {
  const [lineage, setLineage] = useState<LineageNode[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLineage = async () => {
    setLoading(true);
    try {
      const result = await query('SHOW LINEAGE');
      const values = Array.isArray(result?.values) ? result.values : [];
      const tree: LineageNode[] = [];
      values.forEach((row) => {
        const parts = String(row[0]).split('.');
        let currentLevel: LineageNode[] = tree;
        parts.forEach((part, index) => {
          const existing = currentLevel.find((n) => n.name === part);
          if (existing) {
            currentLevel = existing.children || [];
          } else {
            const newNode: LineageNode = {
              name: part,
              type: index === parts.length - 1 ? 'TIMESERIES' : (index === 0 ? 'TEMPLATE' : 'DEVICE'),
              children: [],
            };
            currentLevel.push(newNode);
            currentLevel = newNode.children;
          }
        });
      });
      setLineage(tree);
    } catch (error) {
      message.error('获取血缘关系失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineage();
  }, []);

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color={type === 'TEMPLATE' ? 'blue' : type === 'DEVICE' ? 'green' : 'orange'}>{type}</Tag>,
    },
  ];

  return (
    <div>
      <Card
        title="Schema 血缘分析"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchLineage}>
            刷新
          </Button>
        }
      >
        <Spin spinning={loading}>
          {lineage.length === 0 ? (
            <Alert description="暂无血缘数据" type="info" showIcon />
          ) : (
            <Table
              dataSource={lineage.flatMap((node) => renderNode(node))}
              columns={columns}
              size="small"
              pagination={{ pageSize: 20 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );

  function renderNode(node: LineageNode): any[] {
    const result: any[] = [{ name: node.name, type: node.type, key: node.name }];
    if (node.children) {
      node.children.forEach((child) => {
        result.push(...renderNode(child));
      });
    }
    return result;
  }
};

export default LineageAnalysis;
