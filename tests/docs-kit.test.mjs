import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { compile } from '@mdx-js/mdx';
import { visit } from 'unist-util-visit';
import { docsPlugins } from '../scripts/docs-plugins.mjs';
import { docsSchema } from '../lib/docs-schema.mjs';
import { audit, inspectDocument } from '../scripts/audit-diagrams.mjs';

const features = {
  'terminal-session': 'TerminalSession',
  'code-diff': 'CodeDiff',
  'code-walkthrough': 'CodeWalkthrough',
  'protocol-exchange': 'ProtocolExchange',
  'span-waterfall': 'SpanWaterfall',
};

test('whole curriculum has no remaining unreviewed ASCII/Unicode or Mermaid diagrams', async () => {
  const report = await audit();
  assert.deepEqual(report.failures, []);
  assert.equal(report.counts.mermaid, undefined);
  assert.equal(report.pages, 76);
  for (const lang of ['d2', ...Object.keys(features)]) assert.ok(report.counts[lang] > 0, lang);
});

test('audit rejects new diagrams, disguised diagrams, JSX and changed exemptions', () => {
  for (const source of ['```mermaid\na-->b\n```', '```text\na -> b\n```', '```ts\n// a ──► b\n```', '```ts\n// a --> b\n```', 'a -> b', '<Mermaid chart="a-->b" />', 'a ──► b', '~~~text\na --> b\n~~~']) {
    assert.ok(inspectDocument(source, 'new.mdx').failures.length, source);
  }
  assert.deepEqual(inspectDocument('```ts\nconst fn = () => 1;\n```', 'code.mdx').failures, []);
  assert.deepEqual(inspectDocument('| A | B |\n|---|---|\n| a | b |', 'table.mdx').failures, []);
});

test('migration ledger points to authored D2 captions, including split diagrams', async () => {
  const baseline = JSON.parse(await readFile('scripts/diagram-migration-baseline.json', 'utf8'));
  assert.equal(baseline.length, 29);
  for (const entry of baseline) {
    const source = await readFile(`content/docs/${entry.file}`, 'utf8');
    assert.ok(source.includes(`title="${entry.title}"`) || source.includes(`title="${entry.title} (1/`), entry.title);
    assert.ok(inspectDocument(source, entry.file).artifacts.every((artifact) => artifact.sha256 !== entry.originalSha256), entry.title);
  }
});

test('installed 0.9.8, MDX registry, CSS and page layout schema align', async () => {
  const manifest = JSON.parse(await readFile('package.json', 'utf8'));
  const installed = JSON.parse(await readFile('node_modules/@vanhiep99w/docs-kit/package.json', 'utf8'));
  assert.equal(manifest.dependencies['@vanhiep99w/docs-kit'], '0.9.8');
  assert.equal(installed.version, '0.9.8');
  const registry = await readFile('mdx-components.tsx', 'utf8');
  const css = await readFile('app/global.css', 'utf8');
  for (const [lang, component] of Object.entries({ ...features, d2: 'D2Diagram', 'd2-interactive': 'D2InteractiveDiagram' })) {
    assert.ok(registry.includes(`components/${lang}`), component);
    assert.match(registry, new RegExp(`\\n    ${component},`));
    if (lang !== 'd2-interactive') assert.ok(css.includes(`styles/${lang}.css`), lang);
  }
  assert.equal(docsSchema.parse({ title: 'Demo', d2Layout: 'dagre' }).d2Layout, 'dagre');
  assert.throws(() => docsSchema.parse({ title: 'Demo', d2Layout: 'bogus' }));
});

test('all five authored learning examples compile through the production pipeline', async () => {
  const emitted = new Set();
  for (const file of ['bat-dau/angular-cli', 'http-api-auth/http-client', 'testing-performance-deploy/profiling-performance']) {
    const path = `content/docs/${file}.mdx`;
    const inspect = () => (tree) => {
      visit(tree, 'mdxJsxFlowElement', (node) => emitted.add(node.name));
      visit(tree, 'code', (node) => assert.ok(!features[node.lang]));
    };
    await compile({ value: await readFile(path, 'utf8'), path }, { remarkPlugins: [...docsPlugins, inspect] });
  }
  for (const component of Object.values(features)) assert.ok(emitted.has(component), component);
});

test('invalid learning descriptors fail instead of silently becoming code blocks', async () => {
  for (const lang of Object.keys(features)) {
    await assert.rejects(compile({ value: `\`\`\`${lang}\ntitle: Invalid\nunknown: true\n\`\`\``, path: 'tests/invalid.mdx' }, { remarkPlugins: docsPlugins }));
  }
});

test('vetted catalog icon is unchanged and embedded in both SVG themes', async () => {
  const icon = await readFile('content/images/d2/chrome.svg');
  assert.equal(createHash('sha256').update(icon).digest('hex'), 'd4f14cd4afe14722b2437f6cbcc0811063f1f8a47a6f2722e97fed9927e66a31');
  assert.doesNotMatch(icon.toString(), /<script|on\w+=|foreignObject|(?:href|src)=["']https?:/i);
  const file = 'content/docs/testing-performance-deploy/profiling-performance.mdx';
  let checked = false;
  const inspect = () => (tree) => visit(tree, 'mdxJsxFlowElement', (node) => {
    if (!['D2Diagram', 'D2InteractiveDiagram'].includes(node.name)) return;
    for (const attr of node.attributes.filter((a) => /^(light|dark)Svg$/.test(a.name))) {
      const svg = attr.value.data.estree.body[0].expression.value;
      if (svg.includes('Chrome dispatch')) {
        assert.match(svg, /data:image\/svg\+xml;base64,/);
        assert.doesNotMatch(svg, /https:\/\/icons\.d2lang\.com/);
        checked = true;
      }
    }
  });
  await compile({ value: await readFile(file, 'utf8'), path: file }, { remarkPlugins: [...docsPlugins, inspect] });
  assert.ok(checked);
});
