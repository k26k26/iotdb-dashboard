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

import React from 'react';
import { Alert, Typography } from 'antd';
import { useI18n } from '../../i18n';
import type { ProbeFailure } from '../../stores/connection';

const { Paragraph, Text } = Typography;

const REST_SNIPPET = [
  '####################',
  '### REST Service Configuration',
  '####################',
  'enable_rest_service=true',
  'rest_service_port=18080',
].join('\n');

const Copyable: React.FC<{ text: string }> = ({ text }) => (
  <Paragraph
    copyable={{ text }}
    style={{
      background: '#f5f5f5',
      padding: '8px 12px',
      borderRadius: 4,
      marginBottom: 8,
      whiteSpace: 'pre-wrap',
      fontFamily: 'monospace',
      fontSize: 12,
    }}
  >
    {text}
  </Paragraph>
);

interface Props {
  /** When set, the classified reason for a failed attempt is shown above the checklist. */
  failure?: ProbeFailure | null;
  status?: number;
  target?: string;
}

const ConnectionGuide: React.FC<Props> = ({ failure, status, target }) => {
  const { t } = useI18n();

  /**
   * What each probe failure actually proves. Chrome cannot tell "nothing is listening" from
   * "a firewall dropped the packet", so `refused` and `timeout` are separated only by how fast the
   * request died — enough to point at a different next step, not enough to name a cause.
   */
  const FAILURE_HINT: Record<ProbeFailure, { title: string; detail: string }> = {
    auth: {
      title: t('REST 服务是通的，但凭据被拒'),
      detail: t('节点已经应答了 /ping，只是不接受这个用户名/密码。改对账号即可，不用再动服务端配置。'),
    },
    http: {
      title: t('这个端口上有服务在应答，但它不是可用的 IoTDB REST'),
      detail: t('收到的是 HTTP 错误而不是拒绝连接。多半端口指到了别的服务上，或该节点版本没有这个接口。'),
    },
    blocked: {
      title: t('当前页面是 https，浏览器不允许它去连 http 的节点'),
      detail: t('这是浏览器自身的混合内容限制，和 IoTDB 无关。用 http 打开本应用，或给节点配好 TLS。'),
    },
    refused: {
      title: t('这个地址的端口上没有服务在监听'),
      detail: t('连接被立即拒绝。最常见的原因是 REST 服务没开，或端口填错了。'),
    },
    timeout: {
      title: t('等了很久没有回音'),
      detail: t('要么这个 IP 上没有机器，要么端口被防火墙静默丢包。先确认地址在同一网段，再检查放行规则。'),
    },
  };

  const hint = failure ? FAILURE_HINT[failure] : null;

  return (
    <div>
      {hint && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          title={hint.title}
          description={
            <>
              {hint.detail}
              {target && (
                <>
                  {' '}
                  {t('失败的地址：')}
                  <Text code>{target}</Text>
                  {typeof status === 'number' && t('（HTTP {status}）', { status })}
                </>
              )}
            </>
          }
        />
      )}

      <Alert
        type="info"
        showIcon
        title={t('连不上？按这三步排查')}
        description={
          <div style={{ marginTop: 8 }}>
            <Paragraph style={{ marginBottom: 4 }}>
              <Text strong>{t('1. 确认服务端开启了 REST 服务')}</Text>
            </Paragraph>
            <Paragraph style={{ marginBottom: 4 }}>
              {t('IoTDB 默认')}
              <strong>{t('关闭 REST')}</strong>
              {t('，未开启时本应用的每个请求都会被拒。编辑')}
              <Text code>conf/iotdb-system.properties</Text> {t('加上下面几行，然后')}
              <strong>{t('重启 IoTDB')}</strong>
              {t('——改参数不重启不会生效。')}
            </Paragraph>
            <Copyable text={REST_SNIPPET} />

            <Paragraph style={{ marginBottom: 4 }}>
              <Text strong>{t('2. 放行 18080 端口')}</Text>
            </Paragraph>
            <Paragraph style={{ marginBottom: 4 }}>{t('节点与浏览器不在同一台机器时，主机防火墙通常是不通的原因：')}</Paragraph>
            <Copyable
              text={[
                '# Windows (PowerShell)',
                'netsh advfirewall firewall add rule name="IoTDB REST" dir=in action=allow protocol=TCP localport=18080',
                '',
                '# Linux / firewalld',
                'firewall-cmd --add-port=18080/tcp --permanent && firewall-cmd --reload',
                '',
                '# Linux / ufw',
                'ufw allow 18080/tcp',
              ].join('\n')}
            />
            <Paragraph style={{ marginBottom: 8 }}>
              {t('云主机还要在')}
              <strong>{t('安全组')}</strong>
              {t('里放行同一端口；有 NAT 或容器桥接时，确认映射到的宿主机端口一致。')}
            </Paragraph>

            <Paragraph style={{ marginBottom: 4 }}>
              <Text strong>{t('3. 确认浏览器能直连这个地址')}</Text>
            </Paragraph>
            <Paragraph style={{ marginBottom: 0 }}>
              {t('本项目')}
              <strong>{t('没有后端代理')}</strong>
              {t('，REST 地址由你填写的 host 和 port 直接拼出，所以是')}
              <strong>{t('浏览器')}</strong>
              {t('必须能访问到节点，并且响应要带上你浏览器接受的 CORS 头。')}
              {' '}
              {t('不确定节点在哪台机器上时，用下面的「扫描局域网」把网段里应答 18080 的地址找出来。')}
            </Paragraph>
          </div>
        }
      />
    </div>
  );
};

export default ConnectionGuide;
