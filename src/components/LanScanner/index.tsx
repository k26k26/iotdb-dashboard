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
import { Alert, Button, Input, InputNumber, Progress, Table, Typography } from 'antd';
import { RadarChartOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n';
import {
  SCAN_HOST_COUNT,
  portError,
  prefixError,
  scanBlockedByPage,
  scanLan,
  type ScanHit,
} from '../../services/lanScan';

const { Text } = Typography;

/** Pre-fill from a private IPv4 the user already has; anything else starts blank. */
const suggestPrefix = (host: string): string => {
  const match = /^(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}$/.exec(host.trim());
  return match && !prefixError(match[1]) ? match[1] : '';
};

interface Props {
  currentHost: string;
  currentPort: number;
  /** Called when the user promotes a scan hit into the connection form. */
  onPick?: (host: string, port: number) => void;
}

const LanScanner: React.FC<Props> = ({ currentHost, currentPort, onPick }) => {
  const { t } = useI18n();
  const [prefix, setPrefix] = useState(() => suggestPrefix(currentHost));
  const [port, setPort] = useState(currentPort);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [hits, setHits] = useState<ScanHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const blocked = scanBlockedByPage();

  const start = async () => {
    const invalid = prefixError(prefix) || portError(port);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setHits([]);
    setDone(0);
    setFinished(false);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    const result = await scanLan({
      prefix: prefix.trim(),
      port,
      signal: controller.signal,
      onProgress: (progress) => {
        setDone(progress.done);
        setHits(progress.hits);
      },
    });
    abortRef.current = null;
    setHits(result.hits);
    setDone(result.scanned);
    setFinished(true);
    setRunning(false);
  };

  if (blocked) {
    return (
      <Alert
        type="warning"
        showIcon
        title={t('扫描不可用')}
        description={t('当前页面通过 https 提供，浏览器不允许它去连 http 的节点。用 http 打开本应用后再扫描。')}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('网段前三段')}
          </Text>
          <Input
            addonAfter=".1-255"
            placeholder="192.168.77"
            value={prefix}
            disabled={running}
            onChange={(event) => setPrefix(event.target.value)}
          />
        </div>
        <div style={{ width: 120 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('端口')}
          </Text>
          <InputNumber
            min={1}
            max={65535}
            value={port}
            disabled={running}
            style={{ width: '100%' }}
            onChange={(value) => setPort(Number(value))}
          />
        </div>
        <div style={{ paddingTop: 20 }}>
          {running ? (
            <Button danger onClick={() => abortRef.current?.abort()}>
              {t('停止')}
            </Button>
          ) : (
            <Button icon={<RadarChartOutlined />} type="primary" onClick={start}>
              {t('扫描局域网')}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert type="error" showIcon style={{ marginTop: 12 }} title={error} />
      )}

      {(running || finished) && (
        <Progress
          percent={Math.round((done / SCAN_HOST_COUNT) * 100)}
          status={running ? 'active' : hits.length ? 'normal' : 'exception'}
          format={() => `${done}/${SCAN_HOST_COUNT}`}
          style={{ marginTop: 12 }}
        />
      )}

      {finished && !hits.length && (
        <Alert
          type="warning"
          showIcon
          style={{ marginTop: 12 }}
          title={t('扫完 {total} 个地址，没有任何一个在 {port} 上应答', { total: SCAN_HOST_COUNT, port })}
          description={t('说明这个网段里没有开着该端口的 HTTP 服务。要么 REST 没开（见上面的三步排查），要么端口不是 18080，要么机器不在这个网段。')}
        />
      )}

      {hits.length > 0 && (
        <Table<ScanHit>
          size="small"
          style={{ marginTop: 12 }}
          pagination={false}
          rowKey="host"
          dataSource={hits}
          columns={[
            { title: t('应答地址'), dataIndex: 'host' },
            { title: t('响应 (ms)'), dataIndex: 'ms', width: 100 },
            {
              title: '',
              width: 120,
              render: (_, hit) =>
                onPick && (
                  <Button size="small" type="link" onClick={() => onPick(hit.host, port)}>
                    {t('用这个地址')}
                  </Button>
                ),
            },
          ]}
        />
      )}

      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        {t('浏览器只能靠 HTTP 应答判断端口通不通：列表里的地址确实在 {port} 端口上回应了请求，但不保证就是 IoTDB，也不保证 REST 已开启。扫描只会对本机内网网段发起请求。', { port })}
      </Text>
    </div>
  );
};

export default LanScanner;
