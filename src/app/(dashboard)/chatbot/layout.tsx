import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chatbot',
};

export default function ChatbotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
