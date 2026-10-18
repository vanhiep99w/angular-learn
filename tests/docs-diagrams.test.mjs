import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { compile } from '@mdx-js/mdx';
import { visit } from 'unist-util-visit';
import { docsPlugins } from '../scripts/docs-plugins.mjs';

// Compile the actual MDX, not just extracted fences, to catch MDX syntax,
// SVG generation, duplicate IDs, and component conversion regressions.
test('all documentation D2 diagrams compile with valid themed SVGs', { timeout: 900_000 }, async () => {
  const directory = path.resolve('content/docs');
  const files = (await readdir(directory, { recursive: true }))
    .filter((file) => file.endsWith('.mdx')).sort();
  const layouts = [];
  const failures = [];
  let cursor = 0;

  async function worker() {
    while (cursor < files.length) {
      const relative = files[cursor++];
      const file = path.join(directory, relative);
      const source = await readFile(file, 'utf8');
      if (!/^```d2\b/m.test(source)) continue;
      try {
        const ids = new Set();
        let count = 0;
        const inspect = () => (tree) => {
          visit(tree, 'mdxJsxFlowElement', (node) => {
            if (!['D2Diagram', 'D2InteractiveDiagram'].includes(node.name)) return;
            count++;
            const props = Object.fromEntries(node.attributes.map(({ name, value }) => [
              name, value.data.estree.body[0].expression.type === 'Literal'
                ? value.data.estree.body[0].expression.value
                : JSON.parse(value.data.estree.body[0].expression.arguments[0].value),
            ]));
            assert.ok(props.caption.trim(), `${relative}: missing caption`);
            for (const svg of [props.lightSvg, props.darkSvg]) {
              assert.match(svg, /^<svg/);
              assert.match(svg, /<rect\b[^>]*fill="transparent"/);
              assert.match(svg, /<pattern id="streaks-/);
              const svgIds = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
              for (const id of svgIds) {
                assert.ok(!ids.has(id), `${relative}: duplicate SVG ID ${id}`);
                ids.add(id);
              }
            }
            const [, width, height] = props.lightSvg.match(
              /<svg\b[^>]* width="([\d.]+)" height="([\d.]+)"/,
            );
            layouts.push({ file: relative, caption: props.caption, width: +width, height: +height });
          });
          visit(tree, 'code', (node) => assert.notEqual(node.lang, 'd2'));
        };
        await compile({ value: source, path: file }, { remarkPlugins: [...docsPlugins, inspect] });
        assert.equal(count, [...source.matchAll(/^```d2\b/gm)].length, `${relative}: unconverted fence`);
        console.log(`D2 OK: ${relative} (${count})`);
      } catch (error) {
        failures.push(`${relative}: ${error.stack || error}`);
        console.error(`D2 FAIL: ${relative}: ${error}`);
      }
    }
  }

  await Promise.all([worker(), worker()]);
  await mkdir('.cache/docs-kit/d2', { recursive: true });
  await writeFile('.cache/docs-kit/d2/docs-layout-report.json', JSON.stringify(layouts, null, 2));
  console.log(`Validated ${layouts.length} diagrams across ${new Set(layouts.map((d) => d.file)).size} pages.`);
  assert.deepEqual(failures, []);
  assert.ok(layouts.length > 0);
  const oversized = layouts.filter(({ width, height }) => width > 1000 || height > 430);
  assert.deepEqual(oversized, [], 'Split oversized diagrams instead of shrinking their labels.');
});
