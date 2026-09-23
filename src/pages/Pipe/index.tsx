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
import { Card, Table, Button, Spin, Alert, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getPipes } from '../../services/metadata';
import { formatMillis } from '../../utils/cluster';
import { useI18n } from '../../i18n';
import type { PipeInfo } from '../../types/api';

/** STOPPED is recoverable, DROPPED is terminal -- worth telling apart. */
const stateColor = (state: string): string =>
  ({ RUNNING: 'success', STARTING: 'processing', STOPPED: 'warning', DROPPED: 'error' })[state] ??
  'default';

const NUMERIC = (value: number | null) => (value === null || value === undefined ? '-' : value);

/** Both REST models hand booleans over as text. */
const isYes = (value: boolean | string): boolean => String(value).toLowerCase() === 'true';

/** A pipe without a processor reports an empty string. */
const shown = (value: string | null) => value || '-';

const PipeManagement: React.FC = () => {
  const { t } = useI18n();
  const [pipes, setPipes] = useState<PipeInfo[]>([]);
  const [loading, setLoading] = useState(false);
  // An empty list is a valid state here, so failures have to be reported separately.
  const [error, setError] = useState('');

  const fetchPipes = useCallback(async () => {
    setLoading(true);
    try {
      setPipes(await getPipes());
      setError('');
    } catch (err: any) {
      setError(t('获取 Pipe 列表失败: {msg}', { msg: err.response?.data?.message || err.message }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPipes();
    const interval = setInterval(fetchPipes, 5000);
    return () => clearInterval(interval);
  }, [fetchPipes]);

  const columns = [
    { title: 'Pipe ID', dataIndex: 'pipeId', key: 'pipeId' },
    {
      title: t('创建时间'),
      dataIndex: 'creationTime',
      key: 'creationTime',
      render: (value: PipeInfo['creationTime']) => formatMillis(value),
    },
    {
      title: t('状态'),
      dataIndex: 'state',
      key: 'state',
      render: (state: string) => <Tag color={stateColor(state)}>{state}</Tag>,
    },
    {
      title: t('数据源'),
      dataIndex: 'pipeSource',
      key: 'pipeSource',
      ellipsis: true,
      render: shown,
    },
    {
      title: t('处理器'),
      dataIndex: 'pipeProcessor',
      key: 'pipeProcessor',
      ellipsis: true,
      render: shown,
    },
    {
      title: t('数据去向'),
      dataIndex: 'pipeSink',
      key: 'pipeSink',
      ellipsis: true,
      render: shown,
    },
    {
      title: t('异常信息'),
      dataIndex: 'exceptionMessage',
      key: 'exceptionMessage',
      ellipsis: true,
      render: shown,
    },
    {
      title: t('剩余事件数'),
      dataIndex: 'remainingEventCount',
      key: 'remainingEventCount',
      render: NUMERIC,
    },
    {
      title: t('预计剩余秒数'),
      dataIndex: 'estimatedRemainingSeconds',
      key: 'estimatedRemainingSeconds',
      render: NUMERIC,
    },
    {
      title: t('已降级'),
      dataIndex: 'isDegraded',
      key: 'isDegraded',
      render: (degraded: boolean) =>
        isYes(degraded) ? <Tag color="warning">{t('是')}</Tag> : t('否'),
    },
  ];

  return (
    <div>
      <Card
        title={t('数据管道管理')}
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchPipes}>
            {t('刷新')}
          </Button>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={error} />
          ) : pipes.length === 0 ? (
            <Alert
              type="info"
              showIcon
              title={t('暂无 Pipe')}
              description={t('查询成功，当前集群没有数据管道；需要时执行 CREATE PIPE 语句创建。')}
            />
          ) : (
            <Table
              dataSource={pipes}
              rowKey="pipeId"
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

export default PipeManagement;
