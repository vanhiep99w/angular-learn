'use client';

import type { ComponentProps } from 'react';
import { useDocsPage } from './..';
import { cn } from '../../../../lib/cn';

export function Container(props: ComponentProps<'article'>) {
  const { full } = useDocsPage();

  return (
    <main className="grid [grid-area:main] justify-items-center" data-layout-main="">
      <article
        id="nd-page"
        data-layout-content=""
        data-full={full}
        {...props}
        className={cn(
          'flex flex-col min-w-0 w-full max-w-none px-4 py-6 gap-4 md:px-6 md:pt-8 xl:pt-12',
          full && 'max-w-none',
          props.className,
        )}
      >
        {props.children}
      </article>
    </main>
  );
}
