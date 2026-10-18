import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import type { MDXComponents } from 'mdx/types';
import { D2Diagram } from '@vanhiep99w/docs-kit/components/d2';
import { D2InteractiveDiagram } from '@vanhiep99w/docs-kit/components/d2-interactive';
import { TerminalSession } from '@vanhiep99w/docs-kit/components/terminal-session';
import { CodeDiff } from '@vanhiep99w/docs-kit/components/code-diff';
import { CodeWalkthrough } from '@vanhiep99w/docs-kit/components/code-walkthrough';
import { ProtocolExchange } from '@vanhiep99w/docs-kit/components/protocol-exchange';
import { SpanWaterfall } from '@vanhiep99w/docs-kit/components/span-waterfall';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    D2Diagram,
    D2InteractiveDiagram,
    TerminalSession,
    CodeDiff,
    CodeWalkthrough,
    ProtocolExchange,
    SpanWaterfall,
    ...components,
  };
}
