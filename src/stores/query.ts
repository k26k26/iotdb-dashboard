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
import type { QueryHistoryItem, QueryResult } from '../types/api';

interface QueryState {
  history: QueryHistoryItem[];
  currentResult: QueryResult | null;
  addHistory: (item: QueryHistoryItem) => void;
  setCurrentResult: (result: QueryResult | null) => void;
  clearHistory: () => void;
}

export const useQueryStore = create<QueryState>((set) => ({
  history: [],
  currentResult: null,
  addHistory: (item) =>
    set((state) => ({
      history: [item, ...state.history].slice(0, 50),
    })),
  setCurrentResult: (result) => set({ currentResult: result }),
  clearHistory: () => set({ history: [] }),
}));
