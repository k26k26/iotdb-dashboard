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
import { Card, Button, message, Spin, Descriptions } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { query } from '../../services/rest';
import { useI18n } from '../../i18n';

const SystemInfo: React.FC = () => {
  const { t } = useI18n();
  const [version, setVersion] = useState<string>('');
  const [user, setUser] = useState<string>('');
  const [databases, setDatabases] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const [versionRes, userRes, dbRes] = await Promise.all([
        query('SHOW VERSION'),
        query('SHOW CURRENT USER'),
        query('SHOW DATABASES'),
      ]);

      const versionValues = Array.isArray(versionRes?.values) ? versionRes.values : [];
      const userValues = Array.isArray(userRes?.values) ? userRes.values : [];
      const dbValues = Array.isArray(dbRes?.values) ? dbRes.values : [];

      setVersion(versionValues[0]?.[0] || '');
      setUser(userValues[0]?.[0] || '');
      setDatabases(dbValues.map((row) => row[0]));
    } catch (error) {
      message.error(t('获取系统信息失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, []);

  return (
    <div>
      <Card
        title={t('版本与系统信息')}
        size="small"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchInfo}>
            {t('刷新')}
          </Button>
        }
      >
        <Spin spinning={loading}>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label={t('IoTDB 版本')}>{version || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('当前用户')}>{user || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('数据库数量')}>{databases.length}</Descriptions.Item>
            <Descriptions.Item label={t('数据库列表')}>
              {databases.length > 0 ? databases.join(', ') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Spin>
      </Card>
    </div>
  );
};

export default SystemInfo;
