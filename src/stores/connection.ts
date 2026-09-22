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
import type { ConnectionConfig } from '../types/api';

interface ConnectionState {
  host: string;
  port: number;
  username: string;
  password: string;
  isConnected: boolean;
  setConnection: (config: Partial<ConnectionConfig>) => void;
  setConnected: (connected: boolean) => void;
  testConnection: () => Promise<boolean>;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      host: 'localhost',
      port: 18080,
      username: 'root',
      password: 'root',
      isConnected: false,
      setConnection: (config) => set(config),
      setConnected: (connected) => set({ isConnected: connected }),
      testConnection: async () => {
        try {
          const { host, port, username, password } = get();
          const response = await fetch(`http://${host}:${port}/ping`, {
            method: 'GET',
            headers: {
              Authorization: `Basic ${btoa(`${username}:${password}`)}`,
            },
          });
          return response.ok;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'iotdb-connection',
    }
  )
);
