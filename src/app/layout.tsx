import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sprout - School Management System',
  description: 'Professional School Management System',
};

import { getSession } from '@/lib/auth';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {session && <Sidebar />}
          <main style={{
            marginLeft: session ? '260px' : '0',
            flex: 1,
            padding: '2rem',
            width: '100%'
          }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
