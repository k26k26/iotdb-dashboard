#!/usr/bin/env node
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

// Adds the Apache-2.0 header to source files, or verifies presence with --check.

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const CHECK_ONLY = process.argv.includes('--check');

const TARGETS = ['src', 'vite.config.ts', 'index.html'];

const BODY = [
  'Copyright 2026 liuyu',
  '',
  'Licensed under the Apache License, Version 2.0 (the "License");',
  'you may not use this file except in compliance with the License.',
  'You may obtain a copy of the License at',
  '',
  '    http://www.apache.org/licenses/LICENSE-2.0',
  '',
  'Unless required by applicable law or agreed to in writing, software',
  'distributed under the License is distributed on an "AS IS" BASIS,',
  'WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
  'See the License for the specific language governing permissions and',
  'limitations under the License.',
].join('\n');

function headerFor(file) {
  if (file.endsWith('.html')) {
    return `<!--\n${indent(BODY, '    ')}\n-->\n\n`;
  }
  return `/*\n${indent(BODY, ' * ')}\n */\n\n`;
}

function indent(text, prefix) {
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? prefix + line : prefix.trimEnd()))
    .join('\n');
}

function collect(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      found.push(...collect(full));
      continue;
    }
    if (/\.(ts|tsx|css|html)$/.test(entry)) found.push(full);
  }
  return found;
}

// An HTML comment before <!doctype html> puts the browser in quirks mode, so for
// .html the header goes directly after the doctype instead of at byte 0.
function withHeader(content, file) {
  const header = headerFor(file);
  if (!file.endsWith('.html')) return header + content;
  return content.replace(/<!doctype[^>]*>\s*/i, (match) => `${match}${header}`);
}

const files = [];
for (const target of TARGETS) {
  const full = join(ROOT, target);
  const info = statSync(full);
  files.push(...(info.isDirectory() ? collect(full) : [full]));
}

const missing = [];
const updated = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  if (content.includes('Licensed under the Apache License')) continue;
  const rel = relative(ROOT, file).replaceAll('\\', '/');
  if (CHECK_ONLY) {
    missing.push(rel);
    continue;
  }
  writeFileSync(file, withHeader(content, file), 'utf8');
  updated.push(rel);
}

if (CHECK_ONLY) {
  if (missing.length === 0) {
    console.log(`OK: all ${files.length} source files carry the Apache license header.`);
  } else {
    console.error(`Missing Apache license header in ${missing.length} file(s):`);
    for (const m of missing) console.error(`  ${m}`);
    console.error('\nRun "npm run license" to add them.');
    process.exit(1);
  }
} else {
  console.log(
    updated.length === 0
      ? `Nothing to do: all ${files.length} source files already have headers.`
      : `Added header to ${updated.length} file(s):\n${updated.map((u) => `  ${u}`).join('\n')}`,
  );
}
