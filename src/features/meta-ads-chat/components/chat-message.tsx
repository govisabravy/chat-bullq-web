'use client';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const mdComponents: Components = {
  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
  h1: ({ children }) => <h1 className="my-2 text-base font-semibold text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="my-2 text-sm font-semibold text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="my-2 text-sm font-medium text-white/90">{children}</h3>,
  ul: ({ children }) => <ul className="my-1.5 ml-4 list-disc space-y-0.5 marker:text-white/40">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 ml-4 list-decimal space-y-0.5 marker:text-white/40">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-white/80">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer noopener" className="text-violet-300 underline-offset-2 hover:underline">
      {children}
    </a>
  ),
  code: ({ children, ...props }: any) => {
    const inline = !props?.node?.position || props?.inline;
    if (inline) {
      return <code className="rounded bg-black/40 px-1 py-0.5 text-[11px] text-violet-200">{children}</code>;
    }
    return <code className="block">{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-md border border-white/[0.06] bg-black/50 p-2 text-[11px] leading-snug text-white/80">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-violet-400/40 pl-3 text-white/70">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-white/[0.1]">{children}</thead>,
  th: ({ children }) => <th className="px-2 py-1 text-left font-medium text-white">{children}</th>,
  td: ({ children }) => <td className="border-t border-white/[0.05] px-2 py-1 text-white/80">{children}</td>,
  hr: () => <hr className="my-3 border-white/[0.08]" />,
};

export function ChatMessage({ role, content, streaming }: { role: 'USER' | 'ASSISTANT'; content: string; streaming?: boolean }) {
  const isUser = role === 'USER';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[85%] whitespace-pre-wrap rounded-2xl bg-white text-[#0A0A0B] px-3.5 py-2 text-sm shadow-sm'
            : 'max-w-[85%] rounded-2xl bg-white/[0.04] border border-white/[0.06] px-3.5 py-2 text-sm text-white/90'
        }
      >
        {isUser ? (
          <>{content}{streaming && <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-current align-middle" />}</>
        ) : (
          <div className="text-[13px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {content || (streaming ? '…' : '')}
            </ReactMarkdown>
            {streaming && content && <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-white/70 align-middle" />}
          </div>
        )}
      </div>
    </div>
  );
}
