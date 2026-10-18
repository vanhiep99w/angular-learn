import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProcessor } from '@mdx-js/mdx';
import { visit } from 'unist-util-visit';

export const hash = (value) => createHash('sha256').update(value).digest('hex');
const glyphs = /[┌┐└┘├┤│─►▼▲◄→←]/u;
const learning = new Set(['terminal-session', 'code-diff', 'code-walkthrough', 'protocol-exchange', 'span-waterfall']);

export function inspectDocument(source, file, reviewed = []) {
  const tree = createProcessor().parse({ value: source, path: file });
  const failures = [];
  const artifacts = [];
  const counts = {};
  const masked = source.split('');
  visit(tree, (node) => {
    if (node.type === 'code') {
      const lang = node.lang || '';
      counts[lang] = (counts[lang] || 0) + 1;
      for (let i = node.position.start.offset; i < node.position.end.offset; i++) {
        if (masked[i] !== '\n') masked[i] = ' ';
      }
      if (/mermaid/i.test(lang)) failures.push(`${file}:${node.position.start.line}: Mermaid fence`);
      if (lang === 'd2' || learning.has(lang)) return;
      // Programming arrows/comments are not diagrams. Review every text artifact,
      // plus graphical glyphs even in language-labelled examples (no blanket exemption).
      const asciiGraphic = node.value.split('\n').some((line) =>
        !line.includes('<!--') && !/^\s*-->/.test(line) &&
        (/(?:\S\s+--+>\s+\S|\+[-=]{2,}\+)/.test(line)));
      const candidate = !lang || /^(text|plaintext|ascii|diagram)$/i.test(lang) || glyphs.test(node.value) || asciiGraphic;
      if (!candidate) return;
      const artifact = { file, line: node.position.start.line, lang, sha256: hash(node.value) };
      artifacts.push(artifact);
      const accepted = reviewed.some((item) => item.file === file && item.lang === lang && item.sha256 === artifact.sha256 && item.reason);
      if (!accepted) failures.push(`${file}:${artifact.line}: unreviewed text/graphic artifact`);
    } else if (/mermaid/i.test(node.name || '') ||
      (node.type === 'mdxjsEsm' && /(?:from\s*['"][^'"]*mermaid|import\s*['"]mermaid)/i.test(node.value))) {
      failures.push(`${file}:${node.position.start.line}: Mermaid JSX/import`);
    }
  });
  masked.join('').split('\n').forEach((line, i) => {
    // Lists/tables/prose may contain a single ordinary arrow, not hand-aligned edges.
    if (/[┌┐└┘├┤│─►▼▲◄]/u.test(line) || /^\s*\+[-=]{2,}/u.test(line) ||
      /^\s*[^`]*\s(?:-+>|==+>)\s/.test(line) && !line.includes('`')) {
      failures.push(`${file}:${i + 1}: possible diagram outside a fence`);
    }
  });
  return { failures, artifacts, counts };
}

export async function audit(directory = 'content/docs') {
  const reviewed = JSON.parse(await readFile('scripts/reviewed-text-artifacts.json', 'utf8'));
  const files = (await readdir(directory, { recursive: true })).filter((file) => /\.mdx?$/.test(file)).sort();
  const failures = [], artifacts = [], counts = {};
  for (const file of files) {
    const result = inspectDocument(await readFile(path.join(directory, file), 'utf8'), file, reviewed);
    failures.push(...result.failures); artifacts.push(...result.artifacts);
    for (const [lang, count] of Object.entries(result.counts)) counts[lang] = (counts[lang] || 0) + count;
  }
  for (const item of reviewed) {
    if (!artifacts.some((a) => a.file === item.file && a.lang === item.lang && a.sha256 === item.sha256)) {
      failures.push(`${item.file}: stale artifact exemption`);
    }
  }
  return { pages: files.length, counts, reviewedArtifacts: artifacts.length, failures };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = await audit();
  console.log(JSON.stringify(report, null, 2));
  if (report.failures.length) process.exitCode = 1;
}
