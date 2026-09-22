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

import axios from 'axios';
import { useConnectionStore } from '../stores/connection';

const instance = axios.create({
  timeout: 30000,
});

instance.interceptors.request.use((config) => {
  const { host, port } = useConnectionStore.getState();
  const baseURL = `http://${host}:${port}`;

  if (!config.baseURL || config.baseURL === '/iotdb') {
    config.baseURL = baseURL;
  }

  const { username, password } = useConnectionStore.getState();
  if (username && password) {
    config.headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useConnectionStore.getState().setConnected(false);
    }
    return Promise.reject(error);
  }
);

export default instance;
