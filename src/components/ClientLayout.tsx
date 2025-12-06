'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import Header from './Header';

export default function ClientLayout({
    children,
    sidebar,
    session
}: {
    children: React.ReactNode;
    sidebar: React.ReactNode;
    session: any;
}) {
    const pathname = usePathname();

    // Check for public paths that should be standalone
    const isPublicPage = pathname === '/pay';
    // Check if we are on a specific receipt page (e.g., /receipts/123)
    const isReceiptDetailPage = pathname?.startsWith('/receipts/') && pathname.split('/').length > 2;

    const showSidebar = session && !isReceiptDetailPage && !isPublicPage;
    const showHeader = session && !isReceiptDetailPage && !isPublicPage;

    return (
        <div style={{ minHeight: '100vh', paddingTop: showHeader ? '64px' : '0' }}>
            {showHeader && <Header />}
            <div style={{ display: 'flex' }}>
                {showSidebar && sidebar}
                <main style={{
                    marginLeft: showSidebar ? '260px' : '0',
                    flex: 1,
                    padding: session ? '2rem' : '0',
                    width: '100%'
                }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
