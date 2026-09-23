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
import { Alert, App, Button, Card, Descriptions, Divider, Form, InputNumber, Select, Switch } from 'antd';
import { useSettingsStore } from '../../stores/settings';
import { useConnectionStore, type ProbeResult } from '../../stores/connection';
import { useI18n } from '../../i18n';
import ConnectionGuide from '../../components/ConnectionGuide';
import LanScanner from '../../components/LanScanner';

const Settings: React.FC = () => {
  const { theme, language, maxRows, autoRefresh, refreshInterval, setTheme, setLanguage, setMaxRows, setAutoRefresh, setRefreshInterval } = useSettingsStore();
  const { host, port, username, isConnected, setConnection, setConnected, testConnection } = useConnectionStore();
  const { message } = App.useApp();
  const { t } = useI18n();
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [form] = Form.useForm();

  // The header switch writes theme/language straight into the store, and Form only reads
  // initialValues once, so without this the two controls disagree after a switch.
  useEffect(() => {
    form.setFieldsValue({ theme, language, maxRows, autoRefresh, refreshInterval });
  }, [form, theme, language, maxRows, autoRefresh, refreshInterval]);

  const runProbe = async () => {
    setTesting(true);
    const result = await testConnection();
    setTesting(false);
    setProbe(result);
  };

  const handleSaveSettings = () => {
    message.success(t('设置已保存'));
  };

  const stateText = probe
    ? probe.ok ? t('可用') : t('不可用')
    : isConnected ? t('已连接（由页面内的请求确认）') : t('尚未测试');

  return (
    <div>
      <Card title={t('连接配置')} style={{ marginBottom: 16 }}>
        <Descriptions
          size="small"
          column={1}
          items={[
            { key: 'target', label: t('当前生效的地址'), children: `${username}@${host}:${port}` },
            { key: 'state', label: t('状态'), children: stateText },
          ]}
        />
        <Button type="primary" loading={testing} onClick={runProbe} style={{ marginBottom: 16 }}>
          {t('测试当前连接')}
        </Button>

        {probe?.ok && (
          <Alert
            type="success"
            showIcon
            title={t('已连接 {host}:{port}，/ping 在 {ms}ms 内应答', { host, port, ms: probe.ms })}
            description={t('探测会带上你填写的凭据；/ping 是否校验它们由服务端决定，所以这里确认的是这个地址可达。')}
          />
        )}
        {probe && !probe.ok && (
          <ConnectionGuide failure={probe.failure} status={probe.status} target={`${host}:${port}`} />
        )}

        <Divider style={{ margin: '16px 0' }} />
        <LanScanner
          currentHost={host}
          currentPort={port}
          onPick={(picked, pickedPort) => {
            setConnection({ host: picked, port: pickedPort });
            setConnected(false);
            setProbe(null);
            message.success(t('已把 {host}:{port} 填进连接配置', { host: picked, port: pickedPort }));
          }}
        />
      </Card>

      <Card title={t('通用设置')}>
        <Form form={form} layout="vertical" initialValues={{ theme, language, maxRows, autoRefresh, refreshInterval }}>
          <Form.Item label={t('主题')} name="theme">
            <Select onChange={(value) => setTheme(value)}>
              <Select.Option value="light">{t('浅色')}</Select.Option>
              <Select.Option value="dark">{t('深色')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={t('语言')} name="language">
            <Select onChange={(value) => setLanguage(value)}>
              <Select.Option value="zh">{t('中文')}</Select.Option>
              <Select.Option value="en">English</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label={t('最大行数')} name="maxRows">
            <InputNumber min={100} max={100000} onChange={(value) => setMaxRows(value || 10000)} />
          </Form.Item>
          <Form.Item label={t('自动刷新')} name="autoRefresh" valuePropName="checked">
            <Switch onChange={(checked) => setAutoRefresh(checked)} />
          </Form.Item>
          <Form.Item label={t('刷新间隔 (ms)')} name="refreshInterval">
            <InputNumber min={1000} max={60000} onChange={(value) => setRefreshInterval(value || 3000)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSaveSettings}>
              {t('保存设置')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
