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

/**
 * A browser cannot open a raw TCP socket, so "is port 18080 open" is answered the only way the
 * platform allows: fire an HTTP GET and see whether anything replied. `mode: 'no-cors'` is what
 * makes that usable — it turns the request into a simple one (no preflight) and lets it resolve
 * with an opaque response for *any* reply, including a 404 from a non-IoTDB web server.
 */

import { t } from '../i18n';

export const SCAN_TIMEOUT_MS = 1500;
export const SCAN_CONCURRENCY = 24;
export const SCAN_HOST_COUNT = 255;

export interface ScanHit {
  host: string;
  ms: number;
}

export interface ScanProgress {
  done: number;
  total: number;
  hits: ScanHit[];
}

export interface ScanOptions {
  /** First three octets, e.g. `192.168.77`. */
  prefix: string;
  port: number;
  timeoutMs?: number;
  concurrency?: number;
  onProgress?: (progress: ScanProgress) => void;
  signal?: AbortSignal;
}

export interface ScanResult {
  hits: ScanHit[];
  scanned: number;
  cancelled: boolean;
}

const OCTET = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

/**
 * Only RFC 1918 space is scannable. Without this guard a saved "10.0.0" prefix — or a typed
 * public one — would turn a management console into a port scanner aimed at the internet.
 */
export const prefixError = (prefix: string): string | null => {
  const parts = prefix.trim().split('.');
  if (parts.length !== 3 || parts.some((part) => !OCTET.test(part))) {
    return t('请填写网段的前三段，例如 192.168.77');
  }
  const [a, b] = parts.map(Number);
  const isPrivate = a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
  return isPrivate ? null : t('只能扫描内网网段（10.*、172.16-31.*、192.168.*）');
};

export const portError = (port: number | null): string | null => {
  if (!Number.isInteger(port) || (port as number) < 1 || (port as number) > 65535) {
    return t('端口需要是 1-65535 的整数');
  }
  return null;
};

/**
 * An https page cannot reach a plain-HTTP node. Note this is `location.protocol`, not
 * `isSecureContext` — http://localhost *is* a secure context, and blocking is about the page
 * being https, not about the origin being trustworthy.
 */
export const scanBlockedByPage = (): boolean => window.location.protocol === 'https:';

const probeHost = async (
  host: string,
  port: number,
  timeoutMs: number,
  outer?: AbortSignal
): Promise<{ answered: boolean; ms: number; cancelled: boolean }> => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const timer = setTimeout(abort, timeoutMs);
  outer?.addEventListener('abort', abort);
  const started = performance.now();
  try {
    await fetch(`http://${host}:${port}/ping`, {
      mode: 'no-cors',
      cache: 'no-store',
      signal: controller.signal,
    });
    return { answered: true, ms: Math.round(performance.now() - started), cancelled: false };
  } catch {
    return {
      answered: false,
      ms: Math.round(performance.now() - started),
      cancelled: Boolean(outer?.aborted),
    };
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', abort);
  }
};

export const lastOctet = (host: string): number => Number(host.split('.').pop()) || 0;

export const scanLan = async (options: ScanOptions): Promise<ScanResult> => {
  const { prefix, port, timeoutMs = SCAN_TIMEOUT_MS, concurrency = SCAN_CONCURRENCY, onProgress, signal } = options;
  const targets = Array.from({ length: SCAN_HOST_COUNT }, (_, i) => `${prefix}.${i + 1}`);
  const hits: ScanHit[] = [];
  let cursor = 0;
  let done = 0;
  let cancelled = Boolean(signal?.aborted);

  const report = () => {
    hits.sort((a, b) => lastOctet(a.host) - lastOctet(b.host));
    onProgress?.({ done, total: targets.length, hits: [...hits] });
  };

  const worker = async () => {
    while (!cancelled) {
      const index = cursor;
      cursor += 1;
      if (index >= targets.length) return;
      const result = await probeHost(targets[index], port, timeoutMs, signal);
      if (result.cancelled) {
        cancelled = true;
        return;
      }
      done += 1;
      if (result.answered) hits.push({ host: targets[index], ms: result.ms });
      report();
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, targets.length) }, () => worker())
  );
  return { hits, scanned: done, cancelled };
};
