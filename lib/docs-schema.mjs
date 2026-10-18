import { pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

export const docsSchema = pageSchema.extend({
  d2Layout: z.enum(['elk', 'dagre', 'tala']).optional(),
});
