import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendRoot, '..');

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

test('frontend vite config does not pin mini program builds to the h5 output directory', () => {
  const viteConfig = fs.readFileSync(path.join(frontendRoot, 'vite.config.js'), 'utf8');

  assert.doesNotMatch(
    viteConfig,
    /outputDir:\s*path\.resolve\(__dirname,\s*['"]\.\/unpackage\/dist\/dev\/h5['"]\)/,
    'vite.config.js should not hardcode the h5 output directory for all platforms'
  );
});

test('frontend typography tokens prefer IBM Plex Sans', () => {
  const primitives = fs.readFileSync(path.join(frontendRoot, 'styles', 'tokens', 'primitives.scss'), 'utf8');

  assert.match(primitives, /\$font-family-base:\s*"IBM Plex Sans"/);
  assert.match(primitives, /\$font-family-emphasis:\s*"IBM Plex Sans"/);
});

test('github workflow enumerates frontend node tests instead of passing a quoted glob literal', () => {
  const workflow = fs.readFileSync(path.join(repoRoot, '.github', 'workflows', 'doc-audit.yml'), 'utf8');

  assert.doesNotMatch(workflow, /node --test 'frontend\/\*\*\/__tests__\/\*\.test\.mjs'/);
  assert.match(workflow, /find frontend/);
  assert.match(workflow, /node --test/);
});
