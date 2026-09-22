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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Query from './pages/Query';
import Visualization from './pages/Visualization';
import Explorer from './pages/Explorer';
import Settings from './pages/Settings';
import TimeseriesManagement from './components/DataTable/TimeseriesManagement';
import DataManagement from './components/DataTable/DataManagement';
import DatabaseManagement from './pages/Database';
import QueryCenter from './pages/QueryCenter';
import ClusterManagement from './pages/Cluster';
import TemplateManagement from './pages/Template';
import PipeManagement from './pages/Pipe';
import ExternalServices from './pages/ExternalService';
import UserManagement from './pages/Auth/UserManagement';
import TriggerManagement from './pages/Trigger';
import CqManagement from './pages/CQ';
import IndexManagement from './pages/Index';
import FunctionManagement from './pages/Function';
import ConfigManagement from './pages/Config';
import AlertManagement from './pages/Alert';
import LineageAnalysis from './pages/Lineage';
import SystemInfo from './pages/SystemInfo';
import RealTimeMonitoring from './pages/Realtime';
import AIAnalysis from './pages/AI';
import LatestValues from './pages/LatestValues';
import TenantManagement from './pages/Tenant';
import HighAvailability from './pages/HighAvailability';
import AuditLogs from './pages/Audit';
import BackupRecovery from './pages/Backup';
import PerformanceTuning from './pages/Performance';
import { useSettingsStore } from './stores/settings';

function App() {
  const themeMode = useSettingsStore((state) => state.theme);
  const algorithm = themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;

  return (
    <ConfigProvider locale={zhCN} theme={{ algorithm }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="query" element={<Query />} />
            <Route path="visualization" element={<Visualization />} />
            <Route path="explorer" element={<Explorer />} />
            <Route path="settings" element={<Settings />} />
            <Route path="timeseries" element={<TimeseriesManagement />} />
            <Route path="data" element={<DataManagement />} />
            <Route path="database" element={<DatabaseManagement />} />
            <Route path="query-center" element={<QueryCenter />} />
            <Route path="cluster" element={<ClusterManagement />} />
            <Route path="template" element={<TemplateManagement />} />
            <Route path="pipe" element={<PipeManagement />} />
            <Route path="external-service" element={<ExternalServices />} />
            <Route path="auth" element={<UserManagement />} />
            <Route path="trigger" element={<TriggerManagement />} />
            <Route path="cq" element={<CqManagement />} />
            <Route path="index" element={<IndexManagement />} />
            <Route path="function" element={<FunctionManagement />} />
            <Route path="config" element={<ConfigManagement />} />
            <Route path="alert" element={<AlertManagement />} />
            <Route path="lineage" element={<LineageAnalysis />} />
            <Route path="system" element={<SystemInfo />} />
            <Route path="realtime" element={<RealTimeMonitoring />} />
            <Route path="ai" element={<AIAnalysis />} />
            <Route path="latest-values" element={<LatestValues />} />
            <Route path="tenant" element={<TenantManagement />} />
            <Route path="high-availability" element={<HighAvailability />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="backup" element={<BackupRecovery />} />
            <Route path="performance" element={<PerformanceTuning />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
