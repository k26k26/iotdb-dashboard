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

import { common } from './common';
import { layout } from './layout';
import { settings } from './settings';
import { connection } from './connection';
import { core } from './core';
import { explorer } from './explorer';
import { data } from './data';
import { cluster } from './cluster';
import { pipe } from './pipe';
import { udt } from './udt';
import { schema } from './schema';
import { auth } from './auth';
import { backup } from './backup';
import { alert } from './alert';
import { analysis } from './analysis';
import { insight } from './insight';
import type { Catalog } from './types';

/**
 * Slices stay separate files so areas can be worked on without fighting over one big dictionary.
 * `common` merges first, so an area slice can override a shared word when its context needs a
 * different one; slice-vs-slice disagreements are reported by `npm run i18n:check` instead of
 * silently resolving to whichever translation happens to load last.
 */
export const en: Catalog = Object.assign(
  {},
  common,
  layout,
  settings,
  connection,
  core,
  explorer,
  data,
  cluster,
  pipe,
  udt,
  schema,
  auth,
  backup,
  alert,
  analysis,
  insight
);
