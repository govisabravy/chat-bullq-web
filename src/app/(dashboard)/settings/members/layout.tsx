import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Membros',
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
