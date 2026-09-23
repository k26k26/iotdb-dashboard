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
 * A path is interpolated into statements and into write bodies, so it only ever reaches the server in
 * the bare dotted form IoTDB accepts without quoting: no quotes, no backslash, no space, no wildcard
 * tail. Verified on the live node: `/rest/v2/insertTablet` rejects a relative `device` with
 * `code 305 Path does not exist.`, so a tree device also has to carry its `root.` prefix.
 */
const PATH_SHAPE = /^[A-Za-z一-龥][A-Za-z0-9_一-龥]*(?:\.[A-Za-z0-9_一-龥]+)*$/;

export const normalizePath = (input: string): string | null => {
  const trimmed = input.trim().replace(/(?:\.\*\*|\.\*|\*\*)$/, '').replace(/\.$/, '');
  return PATH_SHAPE.test(trimmed) ? trimmed : null;
};

/** Tree-model paths are absolute; the server never resolves them against `root` for us. */
export const normalizeDevicePath = (input: string): string | null => {
  const path = normalizePath(input);
  return path && (path === 'root' || path.startsWith('root.')) ? path : null;
};
