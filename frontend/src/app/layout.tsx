import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CKB DAO Yield Agent',
  description: 'Autonomous AI agent for CKB wallet management and Nervos DAO yield harvesting',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg-base)' }}>
        {children}
      </body>
    </html>
  );
}
