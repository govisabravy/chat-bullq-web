import React from 'react';

const MAX_FORMAT_LENGTH = 2000;
const TOKEN_RE = /(\*[^*\n]{1,200}\*)|(_[^_\n]{1,200}_)|(https?:\/\/[^\s<>"']{1,500})/g;

export function formatWhatsApp(text: string): React.ReactNode[] {
  if (!text) return [];
  if (text.length > MAX_FORMAT_LENGTH) return [text];

  const lines = text.split('\n');
  const out: React.ReactNode[] = [];

  lines.forEach((line, li) => {
    if (li > 0) out.push(<br key={`br-${li}`} />);
    if (!line) return;

    let lastIndex = 0;
    let i = 0;
    let m: RegExpExecArray | null;
    TOKEN_RE.lastIndex = 0;

    while ((m = TOKEN_RE.exec(line)) !== null) {
      if (m.index > lastIndex) {
        out.push(line.slice(lastIndex, m.index));
      }
      const k = `t-${li}-${i++}`;
      if (m[1]) {
        out.push(<strong key={k} className="font-semibold">{m[1].slice(1, -1)}</strong>);
      } else if (m[2]) {
        out.push(<em key={k} className="italic">{m[2].slice(1, -1)}</em>);
      } else if (m[3]) {
        out.push(
          <a
            key={k}
            href={m[3]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 break-all"
          >
            {m[3]}
          </a>,
        );
      }
      lastIndex = TOKEN_RE.lastIndex;
    }

    if (lastIndex < line.length) {
      out.push(line.slice(lastIndex));
    }
  });

  return out;
}
