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
import { Layout, Menu, Button, theme } from 'antd';
import {
  DashboardOutlined,
  CodeOutlined,
  LineChartOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  WifiOutlined,
  DatabaseOutlined,
  ClusterOutlined,
  ApiOutlined,
  FundOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  BulbOutlined,
  AlertOutlined,
  ShareAltOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CloudServerOutlined,
  FileTextOutlined,
  SaveOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useConnectionStore } from '../../stores/connection';
import ConnectionModal from '../ConnectionModal';

const { Header, Sider, Content } = Layout;

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { host, port, username, isConnected } = useConnectionStore();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    // localStorage can carry a green badge from a session that has since died, so verify once at startup.
    void useConnectionStore.getState().testConnection();
  }, []);

  const menuItems = [
    {
      key: 'core-group',
      icon: <DashboardOutlined />,
      label: '核心功能',
      children: [
        { key: '/', icon: <DashboardOutlined />, label: '首页' },
        { key: '/query', icon: <CodeOutlined />, label: 'SQL 查询' },
        { key: '/visualization', icon: <LineChartOutlined />, label: '可视化' },
        { key: '/explorer', icon: <FolderOpenOutlined />, label: '路径浏览器' },
      ],
    },
    {
      key: 'data-group',
      icon: <DatabaseOutlined />,
      label: '数据管理',
      children: [
        { key: '/database', icon: <DatabaseOutlined />, label: '数据库管理' },
        { key: '/timeseries', icon: <DatabaseOutlined />, label: '测点管理' },
        { key: '/latest-values', icon: <ClockCircleOutlined />, label: '最新值' },
        { key: '/data', icon: <FundOutlined />, label: '数据导入导出' },
      ],
    },
    {
      key: 'ops-group',
      icon: <ClusterOutlined />,
      label: '集群运维',
      children: [
        { key: '/cluster', icon: <ClusterOutlined />, label: '集群管理' },
        { key: '/query-center', icon: <ApiOutlined />, label: '查询中心' },
        { key: '/pipe', icon: <ThunderboltOutlined />, label: '数据管道' },
        { key: '/external-service', icon: <ApiOutlined />, label: '外部服务' },
        { key: '/realtime', icon: <LineChartOutlined />, label: '实时监控' },
      ],
    },
    {
      key: 'advanced-group',
      icon: <SettingOutlined />,
      label: '高级管理',
      children: [
        { key: '/auth', icon: <SafetyCertificateOutlined />, label: '权限管理' },
        { key: '/trigger', icon: <BulbOutlined />, label: '触发器' },
        { key: '/cq', icon: <LineChartOutlined />, label: '连续查询' },
        { key: '/index', icon: <AppstoreOutlined />, label: '索引管理' },
        { key: '/function', icon: <BulbOutlined />, label: '函数管理' },
        { key: '/config', icon: <SettingOutlined />, label: '配置管理' },
      ],
    },
    {
      key: 'ai-group',
      icon: <ExperimentOutlined />,
      label: '智能分析',
      children: [
        { key: '/alert', icon: <AlertOutlined />, label: '告警管理' },
        { key: '/lineage', icon: <ShareAltOutlined />, label: '血缘分析' },
        { key: '/system', icon: <InfoCircleOutlined />, label: '系统信息' },
        { key: '/ai', icon: <ExperimentOutlined />, label: 'AI 分析' },
      ],
    },
    {
      key: 'enterprise-group',
      icon: <SettingOutlined />,
      label: '企业特性',
      children: [
        { key: '/tenant', icon: <UserOutlined />, label: '租户与配额' },
        { key: '/high-availability', icon: <CloudServerOutlined />, label: '高可用监控' },
        { key: '/audit', icon: <FileTextOutlined />, label: '审计日志' },
        { key: '/backup', icon: <SaveOutlined />, label: '备份恢复' },
        { key: '/performance', icon: <ArrowUpOutlined />, label: '性能调优' },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: collapsed ? 16 : 18,
            fontWeight: 'bold',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {collapsed ? 'IoTDB' : 'IoTDB Dashboard'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? '>' : '<'}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: isConnected ? '#52c41a' : '#ff4d4f',
              }}
            >
              <WifiOutlined />
              {isConnected ? '已连接' : '未连接'}
            </span>
            <span style={{ color: '#888' }}>
              {username}@{host}:{port}
            </span>
            <Button type="primary" size="small" onClick={() => setModalOpen(true)}>
              连接配置
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <ConnectionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Layout>
  );
};

export default AppLayout;
