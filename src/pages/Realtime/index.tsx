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
import { formatMillis, isServiceUp } from '../../utils/cluster';
import { useI18n } from '../../i18n';
import type { RegionInfo } from '../../types/api';

const shown = (value: string | null) => value || '-';

/** `CompressionRatio` is the literal text `NaN` for a region holding no tsfiles. */
const ratio = (value: string) => (Number.isFinite(Number(value)) ? value : '-');

const fetchRegions = async (): Promise<RegionInfo[]> => {
  const rows = await queryRows('SHOW REGIONS');
  return rows.map(
    (row) =>
      ({
        regionId: Number(row.RegionId),
        type: String(row.Type ?? ''),
        status: String(row.Status ?? ''),
        database: String(row.Database ?? ''),
        seriesSlotNum: Number(row.SeriesSlotNum),
        timeSlotNum: Number(row.TimeSlotNum),
        dataNodeId: Number(row.DataNodeId),
        rpcAddress: String(row.RpcAddress ?? ''),
        rpcPort: Number(row.RpcPort),
        role: String(row.Role ?? ''),
        createTime: String(row.CreateTime ?? ''),
        tsFileSize: String(row.TsFileSize ?? ''),
        compressionRatio: String(row.CompressionRatio ?? ''),
      }) as RegionInfo
  );
};

const RealTimeMonitoring: React.FC = () => {
  const { t } = useI18n();
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRegions(await fetchRegions());
      setError('');
    } catch (err: any) {
      setError(String(err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const columns = [
    { title: t('区域 ID'), dataIndex: 'regionId', key: 'regionId' },
    { title: t('类型'), dataIndex: 'type', key: 'type' },
    {
      title: t('状态'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={isServiceUp(status) ? 'success' : 'error'}>{status || '-'}</Tag>
      ),
    },
    { title: t('数据库'), dataIndex: 'database', key: 'database', ellipsis: true },
    { title: t('Series 槽'), dataIndex: 'seriesSlotNum', key: 'seriesSlotNum' },
    { title: t('Time 槽'), dataIndex: 'timeSlotNum', key: 'timeSlotNum' },
    { title: 'DataNode', dataIndex: 'dataNodeId', key: 'dataNodeId' },
    {
      title: t('RPC 地址'),
      dataIndex: 'rpcAddress',
      key: 'rpcAddress',
      render: (_: string, record: RegionInfo) => `${record.rpcAddress}:${record.rpcPort}`,
    },
    { title: t('角色'), dataIndex: 'role', key: 'role' },
    {
      title: t('创建时间'),
      dataIndex: 'createTime',
      key: 'createTime',
      render: (value: string) => formatMillis(value),
    },
    { title: t('TsFile 大小'), dataIndex: 'tsFileSize', key: 'tsFileSize', render: shown },
    { title: t('压缩比'), dataIndex: 'compressionRatio', key: 'compressionRatio', render: ratio },
  ];

  return (
    <div>
      <Card
        title={t('实时监控')}
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            {t('刷新')}
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          {t('区域级槽位分配与存储用量，每 5 秒刷新一次。')}
        </Typography.Paragraph>
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={t('获取区域状态失败: {msg}', { msg: error })} />
          ) : regions.length === 0 ? (
            <Alert
              type="info"
              showIcon
              title={t('暂无区域数据')}
              description={t('查询成功，当前集群还没有区域。')}
            />
          ) : (
            <Table
              dataSource={regions}
              rowKey="regionId"
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

export default RealTimeMonitoring;
