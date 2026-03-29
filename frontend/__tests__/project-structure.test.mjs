import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

test('frontend directory contains the minimum uni-app entry files', () => {
  for (const relativePath of ['App.vue', 'pages.json', 'manifest.json', 'main.js', 'index.html', 'uni.scss']) {
    assert.equal(
      fs.existsSync(path.join(frontendRoot, relativePath)),
      true,
      `${relativePath} should exist in frontend/`
    );
  }
});

test('frontend main.js points at the local app entry and adaptor', () => {
  const mainJs = fs.readFileSync(path.join(frontendRoot, 'main.js'), 'utf8');

  assert.match(mainJs, /import App from '\.\/App'/);
  assert.match(mainJs, /import '\.\/uni\.promisify\.adaptor'/);
});

test('frontend registers a formal menstrual home route instead of relying only on showcase pages', () => {
  const pagesJson = fs.readFileSync(path.join(frontendRoot, 'pages.json'), 'utf8');

  assert.equal(
    fs.existsSync(path.join(frontendRoot, 'pages', 'menstrual', 'home.vue')),
    true,
    'pages/menstrual/home.vue should exist'
  );
  assert.match(pagesJson, /"path":\s*"pages\/menstrual\/home"/);
});

test('frontend typography tokens prefer IBM Plex Sans', () => {
  const primitives = fs.readFileSync(path.join(frontendRoot, 'styles', 'tokens', 'primitives.scss'), 'utf8');

  assert.match(primitives, /\$font-family-base:\s*"IBM Plex Sans"/);
  assert.match(primitives, /\$font-family-emphasis:\s*"IBM Plex Sans"/);
});
