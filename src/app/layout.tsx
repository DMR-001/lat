import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import ClientLayout from '@/components/ClientLayout';

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
        <ClientLayout session={session} sidebar={<Sidebar />}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
