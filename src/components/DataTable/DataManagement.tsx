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

import React, { useState } from 'react';
import { Card, Button, Upload, message, Space, Table } from 'antd';
import { UploadOutlined, ExportOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { query } from '../../services/rest';

const DataManagement: React.FC = () => {
  const [fileList, setFileList] = useState<any[]>([]);

  const exportCSV = async () => {
    try {
      const result = await query('SELECT * FROM root');
      const values = Array.isArray(result?.values) ? result.values : [];
      const headers = result.column_names.join(',');
      const rows = values.map((row) => row.map((v: any) => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `iotdb_export_${Date.now()}.csv`;
      link.click();
      message.success('导出成功');
    } catch (error: any) {
      message.error(`导出失败: ${error.response?.data?.message || error.message}`);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
      authorization: 'Bearer xxx',
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`);
      }
      setFileList(info.fileList);
    },
  };

  const columns = [
    { title: '文件名', dataIndex: 'name', key: 'name' },
    { title: '大小', dataIndex: 'size', key: 'size' },
    { title: '状态', dataIndex: 'status', key: 'status' },
  ];

  const dataSource = fileList.map((file) => ({
    key: file.uid,
    name: file.name,
    size: file.size,
    status: file.status,
  }));

  return (
    <div>
      <Card title="数据管理" size="small">
        <Space>
          <Upload {...uploadProps} fileList={fileList}>
            <Button icon={<UploadOutlined />}>上传 CSV</Button>
          </Upload>
          <Button icon={<ExportOutlined />} onClick={exportCSV}>
            导出数据
          </Button>
        </Space>

        <Table
          dataSource={dataSource}
          columns={columns}
          size="small"
          style={{ marginTop: 16 }}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DataManagement;
