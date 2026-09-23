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
import { App, Collapse, Form, Input, InputNumber, Modal } from 'antd';
import { useI18n } from '../../i18n';
import { DEFAULT_HOST, DEFAULT_PORT, useConnectionStore, type ProbeFailure } from '../../stores/connection';
import ConnectionGuide from '../ConnectionGuide';
import LanScanner from '../LanScanner';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ConnectionModal: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { t } = useI18n();
  const { host, port, username, password, setConnection, setConnected } = useConnectionStore();
  const [testing, setTesting] = useState(false);
  const [failure, setFailure] = useState<ProbeFailure | null>(null);
  const [status, setStatus] = useState<number | undefined>();

  useEffect(() => {
    if (open) form.setFieldsValue({ host, port, username, password });
  }, [open, host, port, username, password, form]);

  const submit = async () => {
    const values = await form.validateFields();
    setConnection(values);
    setTesting(true);
    // Read the probe off the store so the values just saved are the ones actually tried.
    const result = await useConnectionStore.getState().testConnection();
    setTesting(false);
    if (result.ok) {
      message.success(
        t('已连接 {host}:{port}（{ms}ms）', { host: values.host, port: values.port, ms: result.ms })
      );
      setFailure(null);
      onClose();
      return;
    }
    setFailure(result.failure ?? 'refused');
    setStatus(result.status);
    setConnected(false);
    message.error(t('连接失败，下面是对应的原因和排查步骤'));
  };

  const tried = `${String(form.getFieldValue('host') || DEFAULT_HOST)}:${String(
    form.getFieldValue('port') || DEFAULT_PORT
  )}`;

  return (
    <Modal
      title={t('连接配置')}
      open={open}
      onOk={submit}
      onCancel={onClose}
      okText={t('测试并连接')}
      cancelText={t('关闭')}
      confirmLoading={testing}
      afterOpenChange={(visible) => {
        if (!visible) {
          setFailure(null);
          setStatus(undefined);
        }
      }}
      width={680}
    >
      <Form form={form} layout="vertical" initialValues={{ host: DEFAULT_HOST, port: DEFAULT_PORT, username, password }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Form.Item
            name="host"
            label="Host"
            rules={[{ required: true, message: t('请输入 Host') }]}
            style={{ flex: '2 1 240px' }}
          >
            <Input placeholder={DEFAULT_HOST} />
          </Form.Item>
          <Form.Item name="port" label="Port" rules={[{ required: true, message: t('请输入 Port') }]} style={{ flex: '1 1 120px' }}>
            <InputNumber min={1} max={65535} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true, message: t('请输入 Username') }]} style={{ flex: '1 1 140px' }}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: t('请输入 Password') }]} style={{ flex: '1 1 140px' }}>
            <Input.Password />
          </Form.Item>
        </div>
      </Form>

      <ConnectionGuide failure={failure} status={status} target={failure ? tried : undefined} />

      <Collapse
        ghost
        style={{ marginTop: 12 }}
        items={[
          {
            key: 'scan',
            label: t('扫描局域网，找出开着 REST 端口的机器'),
            children: (
              <LanScanner
                currentHost={host}
                currentPort={port}
                onPick={(picked, pickedPort) => {
                  form.setFieldsValue({ host: picked, port: pickedPort });
                  setFailure(null);
                }}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default ConnectionModal;
