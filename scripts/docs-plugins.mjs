import { remarkD2 } from '@vanhiep99w/docs-kit/d2';
import { remarkTerminalSession } from '@vanhiep99w/docs-kit/terminal-session';
import { remarkCodeDiff } from '@vanhiep99w/docs-kit/code-diff';
import { remarkCodeWalkthrough } from '@vanhiep99w/docs-kit/code-walkthrough';
import { remarkProtocolExchange } from '@vanhiep99w/docs-kit/protocol-exchange';
import { remarkSpanWaterfall } from '@vanhiep99w/docs-kit/span-waterfall';

// Share the exact production pipeline with focused MDX tests; viewer defaults come from docs-kit.
export const d2Options = {
  // Preserve this curriculum's compact SVG dimensions across docs-kit upgrades.
  scale: 0.75,
  // Pages' documented Next.js cache path; enable Build cache in its dashboard.
  cacheDir: '.next/cache/docs-kit/d2',
  assetsRoot: 'content/images/d2',
  concurrency: 1,
};
/** @type {import('unified').PluggableList} */
export const docsPlugins = [
  [remarkD2, d2Options],
  remarkTerminalSession,
  remarkCodeDiff,
  remarkCodeWalkthrough,
  remarkProtocolExchange,
  remarkSpanWaterfall,
];
