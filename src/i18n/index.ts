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

import { useCallback } from 'react';
import { useSettingsStore } from '../stores/settings';
import { en } from './en';

export type Lang = 'zh' | 'en';
export type Params = Record<string, string | number>;

/** `{name}` tokens are filled from params so one entry covers every interpolated message. */
const interpolate = (text: string, params?: Params): string =>
  params
    ? text.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in params ? String(params[key]) : match
      )
    : text;

/**
 * A message that is computed early and displayed later. `tx()` keeps the Chinese source plus its
 * values instead of a finished sentence, so a rule-engine conclusion that is sitting on screen
 * still changes language when the switch is flipped. Typing a field as `Text` also makes it a
 * compile error to render it without going through `t()`.
 */
export interface Text {
  readonly key: string;
  readonly params?: Params;
}

export const tx = (key: string, params?: Params): Text => ({ key, params });

const resolve = (language: Lang, source: Text | string, params?: Params): string => {
  const key = typeof source === 'string' ? source : source.key;
  const values = typeof source === 'string' ? params : source.params;
  return interpolate(language === 'en' ? en[key] ?? key : key, values);
};

/**
 * Usable outside React, but note it reads the language at call time: a string built once and kept
 * in state keeps the language it was built in. Anything rendered repeatedly should go through
 * `useI18n()` so a language switch re-renders it.
 */
export const t = (source: Text | string, params?: Params): string =>
  resolve(useSettingsStore.getState().language, source, params);

export type Translate = (source: Text | string, params?: Params) => string;

export const useI18n = (): { language: Lang; t: Translate } => {
  const language = useSettingsStore((state) => state.language);
  return { language, t: useCallback((source: Text | string, params?: Params) => resolve(language, source, params), [language]) };
};
