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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  maxRows: number;
  autoRefresh: boolean;
  refreshInterval: number;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'zh' | 'en') => void;
  setMaxRows: (maxRows: number) => void;
  setAutoRefresh: (autoRefresh: boolean) => void;
  setRefreshInterval: (interval: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'zh',
      maxRows: 10000,
      autoRefresh: false,
      refreshInterval: 3000,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setMaxRows: (maxRows) => set({ maxRows }),
      setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
      setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
    }),
    {
      name: 'iotdb-settings',
    }
  )
);
