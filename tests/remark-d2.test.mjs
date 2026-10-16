import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { compile } from '@mdx-js/mdx';
import { remarkD2 } from '@vanhiep99w/docs-kit/d2';

async function transform(value, path = 'tests/fixture.mdx') {
  let tree;
  const capture = () => (result) => { tree = result; };
  const compiled = await compile({ value, path }, {
    remarkPlugins: [remarkD2, capture],
  });
  return { tree, compiled: String(compiled) };
}

function props(node) {
  return Object.fromEntries(node.attributes.map(({ name, value }) => [
    name, value.data.estree.body[0].expression.value,
  ]));
}

const fence = '```d2 title="Guard và resolver"\na -> b\n```';

test('renders D2 to themed SVGs at compile time and reuses disk cache', async () => {
  const first = await transform(fence);
  const node = first.tree.children[0];
  assert.equal(node.type, 'mdxJsxFlowElement');
  assert.equal(node.name, 'D2Diagram');
  const result = props(node);
  assert.equal(result.caption, 'Guard và resolver');
  assert.match(result.lightSvg, /^<svg/);
  assert.match(result.darkSvg, /^<svg/);
  assert.notEqual(result.lightSvg, result.darkSvg);
  for (const svg of [result.lightSvg, result.darkSvg]) {
    assert.match(svg, /<pattern id="streaks-/); // Real sketch output, not a CSS filter.
    assert.match(svg, /<rect\b[^>]*fill="transparent"/);
    const [, viewWidth, viewHeight, width, height] = svg.match(
      /viewBox="0 0 ([\d.]+) ([\d.]+)" width="([\d.]+)" height="([\d.]+)"/,
    );
    assert.ok(Math.abs(Number(width) / Number(viewWidth) - 0.75) < 0.02);
    assert.ok(Math.abs(Number(height) / Number(viewHeight) - 0.75) < 0.02);
  }
  assert.doesNotMatch(result.lightSvg, /prefers-color-scheme|<\?xml/);
  assert.doesNotMatch(first.compiled, /@terrastruct|child_process/);
  assert.deepEqual(props((await transform(fence)).tree.children[0]), result);
});

test('the navigation example stays compact and horizontal', async () => {
  const document = await readFile(new URL(
    '../content/docs/routing-forms/guards-resolvers.mdx', import.meta.url,
  ), 'utf8');
  const [fence] = document.match(/^```d2[^\n]*\n[\s\S]*?^```/m);
  const { tree } = await transform(fence, 'tests/navigation-example.mdx');
  const { lightSvg } = props(tree.children[0]);
  const [, width, height] = lightSvg.match(/<svg\b[^>]* width="([\d.]+)" height="([\d.]+)"/);
  assert.ok(Number(width) < 800);
  assert.ok(Number(height) < 200);
  assert.ok(Number(width) / Number(height) > 3);
  for (const label of ['Router', 'Guard', 'Resolver', 'Tạo component', 'chuyển hướng']) {
    assert.ok(lightSvg.includes(label));
  }
});

test('leaves ASCII and normal code fences unchanged', async () => {
  const { tree } = await transform('```text\na -> b\n```\n\n```ts\nconst n = 1;\n```');
  assert.deepEqual(tree.children.map(({ type, lang }) => [type, lang]), [
    ['code', 'text'], ['code', 'ts'],
  ]);
});

test('duplicate diagrams get unique SVG IDs, including across documents', async () => {
  const { tree } = await transform(`${fence}\n\n${fence}`);
  const first = props(tree.children[0]);
  const second = props(tree.children[1]);
  const otherPage = props((await transform(fence, 'tests/other.mdx')).tree.children[0]);
  assert.notEqual(first.id, second.id);
  assert.notEqual(first.id, otherPage.id);
  const svgIds = (svg) => [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const firstIds = svgIds(first.lightSvg);
  assert.ok(firstIds.length > 0);
  for (const svg of [first.darkSvg, second.lightSvg, otherPage.lightSvg]) {
    const ids = new Set(svgIds(svg));
    assert.ok(firstIds.every((id) => !ids.has(id)));
  }
});

test('invalid syntax fails compilation with the source file and position', async () => {
  await assert.rejects(
    transform('```d2\na: {\n```', 'tests/broken.mdx'),
    (error) => {
      assert.match(error.message, /D2 diagram failed/);
      assert.match(error.file, /broken\.mdx$/);
      assert.equal(error.line, 1);
      return true;
    },
  );
});

test('a failed render does not poison a corrected diagram', async () => {
  const { tree } = await transform('```d2\na: {label: Fixed}\n```', 'tests/broken.mdx');
  assert.match(props(tree.children[0]).lightSvg, /Fixed/);
});
