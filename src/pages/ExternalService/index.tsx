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

import React, { useCallback, useEffect, useState } from 'react';
import { Card, Table, Button, Spin, Alert, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { queryRows } from '../../services/rest';
import type { PipePluginInfo } from '../../types/api';

const shown = (value: string | null) => value || '-';

const fetchPlugins = async (): Promise<PipePluginInfo[]> => {
  const rows = await queryRows('SHOW PIPEPLUGINS');
  return rows.map(
    (row) =>
      ({
        pluginName: String(row.PluginName ?? ''),
        pluginType: String(row.PluginType ?? ''),
        className: String(row.ClassName ?? ''),
        pluginJar: String(row.PluginJar ?? ''),
        exceptionMessage: String(row.ExceptionMessage ?? ''),
      }) as PipePluginInfo
  );
};

const ExternalServices: React.FC = () => {
  const [plugins, setPlugins] = useState<PipePluginInfo[]>([]);
  const [loading, setLoading] = useState(false);
  // A cluster with no custom jars legitimately lists only builtins, so failures need their own state.
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPlugins(await fetchPlugins());
      setError('');
    } catch (err: any) {
      setError(`获取外部服务列表失败: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns = [
    { title: '插件名称', dataIndex: 'pluginName', key: 'pluginName' },
    {
      title: '类别',
      dataIndex: 'pluginType',
      key: 'pluginType',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    { title: '实现类', dataIndex: 'className', key: 'className', ellipsis: true },
    {
      title: 'JAR 包',
      dataIndex: 'pluginJar',
      key: 'pluginJar',
      ellipsis: true,
      render: shown,
    },
    {
      title: '加载异常',
      dataIndex: 'exceptionMessage',
      key: 'exceptionMessage',
      ellipsis: true,
      render: shown,
    },
  ];

  return (
    <div>
      <Card
        title="外部服务管理"
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            刷新
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          外部服务即管道连接器插件，供数据管道的 source / processor / sink 引用；可用
          <code>CREATE PIPE PLUGIN</code> 注册自定义 JAR。
        </Typography.Paragraph>
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={error} />
          ) : plugins.length === 0 ? (
            <Alert
              type="info"
              showIcon
              title="暂无外部服务"
              description="查询成功，当前集群没有可用的连接器插件。"
            />
          ) : (
            <Table
              dataSource={plugins}
              rowKey="pluginName"
              columns={columns}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default ExternalServices;
