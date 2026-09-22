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

import dayjs from 'dayjs';
import type { ColumnType } from 'antd/es/table';
import type { CurrentQuery } from '../types/api';

/** Nodes report `Running` while services report `RUNNING`. */
export const isServiceUp = (state: string): boolean =>
  ['running', 'normal', 'up'].includes(String(state).toLowerCase());

export const formatMillis = (value: number | null): string =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';

export const queryColumns: ColumnType<CurrentQuery>[] = [
  { title: 'Query ID', dataIndex: 'queryId', key: 'queryId' },
  { title: 'State', dataIndex: 'state', key: 'state' },
  { title: 'Statement', dataIndex: 'statement', key: 'statement', ellipsis: true },
  {
    title: 'Start Time',
    dataIndex: 'startTime',
    key: 'startTime',
    render: (value: number) => formatMillis(value),
  },
  {
    title: 'Cost (ms)',
    dataIndex: 'costTime',
    key: 'costTime',
    render: (value: number | null) => (value === null || value === undefined ? '-' : value),
  },
];
