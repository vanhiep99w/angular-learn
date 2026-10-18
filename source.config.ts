import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { docsPlugins } from './scripts/docs-plugins.mjs';
import { docsSchema } from './lib/docs-schema.mjs';

export const docs = defineDocs({
  dir: 'content/docs',
  docs: { schema: docsSchema },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: docsPlugins,
  },
});
