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
import { Card, Button, message, Space, Alert } from 'antd';
import { ExperimentOutlined } from '@ant-design/icons';

const AIAnalysis: React.FC = () => {
  const handleAnalyze = async () => {
    try {
      message.info('AI 分析功能开发中，敬请期待');
    } catch (error: any) {
      message.error(`分析失败: ${error.message}`);
    }
  };

  return (
    <div>
      <Card title="AI 分析" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="AI 分析功能预留"
            description="此模块为后续智能分析预留接口，当前仅做占位展示。"
            type="info"
            showIcon
          />
          <Button type="primary" icon={<ExperimentOutlined />} onClick={handleAnalyze}>
            开始分析
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default AIAnalysis;
