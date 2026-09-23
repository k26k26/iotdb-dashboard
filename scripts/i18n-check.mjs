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

// Coverage gate for the zh/en switch: every Chinese literal shown to the user must be wrapped in
// t('...'), and no two dictionary slices may disagree about the same source string.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// CJK ideographs plus the two CJK punctuation blocks: a full-width （ or ， left in a template
// literal shows up inside an English sentence, so it is a leak even though no Chinese word is.
const CJK = /[　-〿一-鿿＀-￯]/;
const ROOT = process.cwd();

const walk = (dir, out = []) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
};

const files = walk(join(ROOT, 'src')).filter((file) => !file.includes(join('i18n', 'en')));

const missed = [];
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  let inBlockComment = false;
  lines.forEach((raw, index) => {
    let line = raw;
    if (inBlockComment) {
      if (line.includes('*/')) line = line.slice(line.indexOf('*/') + 2);
      else return;
      inBlockComment = false;
    }
    line = line
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/(?!.*\{).*/g, '')
      .replace(/\/\*.*$/g, '');
    if (line.includes('/*')) inBlockComment = true;
    // Checked against the raw line: the marker lives in a comment, which the stripping below erases.
    if (raw.includes('i18n-ignore')) return;
    // Drop the translated forms so what is left is genuinely unwrapped. `tx()` marks a literal that
    // is stored as a key now and rendered through t() later.
    line = line.replace(/\b(?:t|tx)\(\s*(['"`])(?:\\.|(?!\1)[\s\S])*?\1/g, '');
    if (CJK.test(line)) missed.push(`${relative(ROOT, file)}:${index + 1}: ${raw.trim().slice(0, 110)}`);
  });
}

const conflicts = [];
const area = new Map();
const all = new Map();
for (const file of walk(join(ROOT, 'src', 'i18n', 'en'))) {
  if (file.endsWith('index.ts') || file.endsWith('types.ts')) continue;
  // common.ts is the base layer: area slices merge over it on purpose, so only slice-vs-slice
  // disagreements are conflicts.
  const isBase = file.endsWith(join('en', 'common.ts'));
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(/^\s*'([^']+)':\s*'([^']*)'/gm)) {
    const [, key, value] = match;
    if (!isBase) {
      const previous = area.get(key);
      if (previous && previous !== value) {
        conflicts.push(`'${key}' -> '${previous}' vs '${value}' in ${relative(ROOT, file)}`);
      }
      area.set(key, value);
    }
    if (!all.has(key)) all.set(key, value);
  }
}

console.log(`dictionary entries: ${all.size}`);
console.log(`unwrapped Chinese lines: ${missed.length}`);
for (const line of missed) console.log(`  ${line}`);
if (conflicts.length) {
  console.log(`conflicting entries: ${conflicts.length}`);
  for (const line of conflicts) console.log(`  ${line}`);
}
process.exit(missed.length || conflicts.length ? 1 : 0);
