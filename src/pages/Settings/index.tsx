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
import { Card, Form, Input, InputNumber, Switch, Select, Button, message } from 'antd';
import { useSettingsStore } from '../../stores/settings';

const Settings: React.FC = () => {
  const { theme, language, maxRows, autoRefresh, refreshInterval, setTheme, setLanguage, setMaxRows, setAutoRefresh, setRefreshInterval } = useSettingsStore();

  const handleSaveSettings = () => {
    message.success('设置已保存');
  };

  return (
    <div>
      <Card title="连接配置" style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="Host">
            <Input defaultValue="localhost" />
          </Form.Item>
          <Form.Item label="Port">
            <InputNumber min={1} max={65535} defaultValue={18080} />
          </Form.Item>
          <Form.Item label="Username">
            <Input defaultValue="root" />
          </Form.Item>
          <Form.Item label="Password">
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={() => message.success('连接配置已更新')}>
              保存连接配置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="通用设置">
        <Form layout="vertical" initialValues={{ theme, language, maxRows, autoRefresh, refreshInterval }}>
          <Form.Item label="主题" name="theme">
            <Select onChange={(value) => setTheme(value)}>
              <Select.Option value="light">浅色</Select.Option>
              <Select.Option value="dark">深色</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="语言" name="language">
            <Select onChange={(value) => setLanguage(value)}>
              <Select.Option value="zh">中文</Select.Option>
              <Select.Option value="en">English</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="最大行数" name="maxRows">
            <InputNumber min={100} max={100000} onChange={(value) => setMaxRows(value || 10000)} />
          </Form.Item>
          <Form.Item label="自动刷新" name="autoRefresh" valuePropName="checked">
            <Switch onChange={(checked) => setAutoRefresh(checked)} />
          </Form.Item>
          <Form.Item label="刷新间隔 (ms)" name="refreshInterval">
            <InputNumber min={1000} max={60000} onChange={(value) => setRefreshInterval(value || 3000)} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSaveSettings}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
