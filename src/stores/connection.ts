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
  testConnection: () => Promise<ProbeResult>;
}

/**
 * What ships in the repo: a placeholder that reaches nothing. A developer points it at their own
 * node with `.env.local` (git-ignored), so no intranet address ever gets committed.
 */
const FALLBACK_HOST = '127.0.0.1';
const FALLBACK_PORT = 18080;

export const DEFAULT_HOST = (import.meta.env.VITE_IOTDB_HOST as string | undefined)?.trim() || FALLBACK_HOST;
export const DEFAULT_PORT = Number(import.meta.env.VITE_IOTDB_PORT) || FALLBACK_PORT;
export const HAS_LOCAL_DEFAULT = DEFAULT_HOST !== FALLBACK_HOST;

/** How long a probe waits for an answer before giving up. */
export const PROBE_TIMEOUT_MS = 4000;

/**
 * Chrome collapses connection-refused, dropped packets and CORS failures into one opaque
 * TypeError, so the only usable signal left is how long it took: an immediate failure means
 * something answered "no" (nothing listening), a slow one means nobody answered at all.
 */
const FAST_FAIL_MS = 1000;

export type ProbeFailure = 'auth' | 'http' | 'blocked' | 'refused' | 'timeout';

export interface ProbeResult {
  ok: boolean;
  failure?: ProbeFailure;
  status?: number;
  ms: number;
}

export const probeEndpoint = async (
  target: { host: string; port: number; username: string; password: string }
): Promise<ProbeResult> => {
  const url = `http://${target.host}:${target.port}/ping`;
  if (window.location.protocol === 'https:') {
    // An https page cannot reach a plain-HTTP node; the browser blocks it before it leaves.
    return { ok: false, failure: 'blocked', ms: 0 };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const started = performance.now();
  const elapsed = () => Math.round(performance.now() - started);
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Basic ${btoa(`${target.username}:${target.password}`)}` },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (response.ok) return { ok: true, status: response.status, ms: elapsed() };
    if (response.status === 401 || response.status === 403) {
      return { ok: false, failure: 'auth', status: response.status, ms: elapsed() };
    }
    return { ok: false, failure: 'http', status: response.status, ms: elapsed() };
  } catch {
    if (controller.signal.aborted) return { ok: false, failure: 'timeout', ms: elapsed() };
    return { ok: false, failure: elapsed() < FAST_FAIL_MS ? 'refused' : 'timeout', ms: elapsed() };
  } finally {
    clearTimeout(timer);
  }
};

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
      username: 'root',
      password: 'root',
      isConnected: false,
      setConnection: (config) => set(config),
      // Real traffic drives this, so skip the write (and the localStorage churn) when unchanged.
      setConnected: (connected) =>
        set((state) => (state.isConnected === connected ? state : { isConnected: connected })),
      testConnection: async () => {
        const { host, port, username, password } = get();
        const result = await probeEndpoint({ host, port, username, password });
        set({ isConnected: result.ok });
        return result;
      },
    }),
    {
      name: 'iotdb-connection',
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ConnectionState>;
        // A browser still holding the shipped placeholder has never been pointed at anything real,
        // so the locally configured default wins over it. Anything the user typed by hand is kept.
        if (HAS_LOCAL_DEFAULT && saved.host === FALLBACK_HOST) {
          return { ...current, ...saved, host: DEFAULT_HOST };
        }
        return { ...current, ...saved };
      },
    }
  )
);
