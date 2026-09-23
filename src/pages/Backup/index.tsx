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
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import { ImportOutlined, ReloadOutlined } from '@ant-design/icons';
import { nonQuery, queryRows } from '../../services/rest';
import { t, useI18n } from '../../i18n';

interface DatabaseRow {
  database: string;
  schemaReplicationFactor: number;
  dataReplicationFactor: number;
  timePartitionInterval: number;
}

const describe = (err: any): string => err.response?.data?.message || err.message || t('请求失败');

/**
 * LOAD takes one quoted literal, so the path may not carry a quote -- the value the user typed would
 * end the string and start writing SQL. Backslashes go too: the server answers those with a bare
 * HTTP 500 (verified: `LOAD 'D:\file\x.tsfile'` never reaches the engine), so a Windows path cannot be
 * sent even though it would be meaningless on the node anyway -- paths resolve on the server's host.
 */
const LOAD_PATH = /^[^'"\\\s]+$/;

/** SHOW DATABASES reports the interval in millis; 604800000 reads better as 7 天. */
const duration = (ms: unknown): string => {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return '-';
  const units: [number, (n: number) => string][] = [
    [86400000, (n) => t('{n} 天', { n })],
    [3600000, (n) => t('{n} 小时', { n })],
    [60000, (n) => t('{n} 分钟', { n })],
    [1000, (n) => t('{n} 秒', { n })],
  ];
  for (const [size, say] of units) {
    if (value % size === 0) return say(value / size);
  }
  return t('{n} 毫秒', { n: value });
};

/** Statement text the two notices below quote; inside those sentences it stands in as {cN}. */
const QUOTED = [
  "BACKUP DATABASE root.sg TO '/backup'",
  '/rest/v2/query',
  "mismatched input 'BACKUP' expecting … FLUSH … LOAD … UNLOAD …",
  'SHOW BACKUP TASKS',
  'SHOW TASKS',
  'no viable alternative',
  'FLUSH',
  'data/datanode',
  "LOAD '…'",
  'UNLOAD',
  'ASTVisitor',
  'visitUnloadFile',
  'This operation type is not supported',
];

/** Puts the quoted statements back where the sentence left them out, so each notice stays one string. */
const quoted = (text: string): React.ReactNode[] =>
  text.split(/(\{c\d+\})/).map((part, i) =>
    part.startsWith('{c') ? <code key={i}>{QUOTED[Number(part.slice(2, -1))]}</code> : part
  );

/**
 * There is no backup statement in this build, so the page invents no task table: it lists what has to be
 * backed up and exposes the two file-level statements that really execute (`FLUSH`, `LOAD`).
 */
const BackupRecovery: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { message } = AntdApp.useApp();
  const { t } = useI18n();

  const fetchDatabases = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await queryRows('SHOW DATABASES');
      setDatabases(
        rows.map((row) => ({
          database: String(row.Database),
          schemaReplicationFactor: Number(row.SchemaReplicationFactor),
          dataReplicationFactor: Number(row.DataReplicationFactor),
          timePartitionInterval: Number(row.TimePartitionInterval),
        }))
      );
      setError('');
    } catch (err: any) {
      setDatabases([]);
      setError(describe(err));
      message.error(t('获取数据库列表失败: {msg}', { msg: describe(err) }));
    } finally {
      setLoading(false);
    }
  }, [message, t]);

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const flush = async (database: string) => {
    try {
      await nonQuery(`FLUSH ${database}`);
      message.success(t('{db} 已刷盘，之后的目录拷贝才会包含内存里的数据', { db: database }));
    } catch (err: any) {
      message.error(t('刷盘失败: {msg}', { msg: describe(err) }));
    }
  };

  const load = async (values: { path: string }) => {
    try {
      await nonQuery(`LOAD '${values.path.trim()}'`);
      message.success(t('{path} 导入完成', { path: values.path }));
      setModalOpen(false);
      form.resetFields();
      fetchDatabases();
    } catch (err: any) {
      message.error(t('导入失败: {msg}', { msg: describe(err) }));
    }
  };

  const columns = [
    { title: t('数据库'), dataIndex: 'database', key: 'database' },
    {
      title: t('Schema 副本'),
      dataIndex: 'schemaReplicationFactor',
      key: 'schemaReplicationFactor',
    },
    {
      title: t('数据副本'),
      dataIndex: 'dataReplicationFactor',
      key: 'dataReplicationFactor',
    },
    {
      title: t('时间分区间隔'),
      dataIndex: 'timePartitionInterval',
      key: 'timePartitionInterval',
      render: (ms: number) => duration(ms),
    },
    {
      title: t('备份判断'),
      key: 'verdict',
      render: (_: unknown, record: DatabaseRow) => {
        const factor = Math.max(record.schemaReplicationFactor, record.dataReplicationFactor);
        return factor <= 1 ? (
          <Tag color="warning">{t('单份拷贝：承载节点的文件坏了就没有第二份，必须往集群外备份')}</Tag>
        ) : (
          <Tag color="success">{t('{n} 份副本：可容忍节点整体丢失，跨机备份仍然要做', { n: factor })}</Tag>
        );
      },
    },
    {
      title: t('操作'),
      key: 'action',
      render: (_: unknown, record: DatabaseRow) => (
        <Popconfirm
          title={t('刷出 {db} 的内存数据？', { db: record.database })}
          description={t('拷贝目录前的第一步：没刷盘的数据还只在 memtable 里。')}
          onConfirm={() => flush(record.database)}
        >
          <Button type="link">{t('刷盘')}</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        title={t('IoTDB 2.0.11 没有备份/恢复语句，也没有备份任务可列')}
        description={
          <>
            {quoted(
              t('把 {c0} 发给 {c1}，服务端回 {c2}：它列出的顶层关键字里有 LOAD / UNLOAD / FLUSH，唯独没有 BACKUP 和 RESTORE，{c3} 与 {c4} 也都是 {c5}。原来那张表里的 taskId、状态、起止时间，没有任何语句写得进去。')
            )}
            <br />
            {quoted(
              t('真实的文件级备份分三步：先 {c6} 落盘（下表每行都有按钮），再到 DataNode 主机上拷 {c7} 目录；恢复时把目录放回去，或者只用 {c8} 把单个 TsFile 导回来（右上角按钮）。导出那一半走不了 SQL：{c9} 在语法文件里确实有规则，但 {c10} 里没有 {c11}，REST 层直接回 {c12}。要把数据持续复制到另一套集群，用「数据同步」页的 Pipe。')
            )}
          </>
        }
      />
      <Card
        title={t('备份对象')}
        size="small"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchDatabases}>
              {t('刷新')}
            </Button>
            <Button type="primary" icon={<ImportOutlined />} onClick={() => setModalOpen(true)}>
              {t('导入 TsFile（LOAD）')}
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {error ? (
            <Alert type="error" showIcon title={t('读取备份对象失败')} description={error} />
          ) : (
            <Table
              dataSource={databases}
              columns={columns}
              rowKey={(record) => record.database}
              size="small"
              scroll={{ x: 'max-content' }}
              pagination={{ pageSize: 20 }}
              locale={{ emptyText: t('这个集群里还没有数据库（SHOW DATABASES 返回 0 行）') }}
            />
          )}
        </Spin>
      </Card>

      <Modal title={t('导入 TsFile（LOAD）')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={load}>
          <Form.Item
            name="path"
            label={t('TsFile 在 IoTDB 主机上的路径')}
            extra={t('这是服务端那台机器上的路径，不是你浏览器这台机器的——文件得先在 DataNode 主机上；只写文件名时它按服务端工作目录补齐（本节点是 /opt/soft/apache-iotdb-2.0.11-all-bin/sbin/）。')}
            rules={[
              { required: true, message: t('请输入 TsFile 路径') },
              {
                pattern: LOAD_PATH,
                message: t('不能含空格、单引号、双引号或反斜杠：带反斜杠的请求服务端直接回 HTTP 500，所以 D:\\file 这种写法要先换成服务器上的真实路径'),
              },
            ]}
          >
            <Input placeholder="/data/backup/node1/1-0-0.tsfile" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {t('导入')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BackupRecovery;
