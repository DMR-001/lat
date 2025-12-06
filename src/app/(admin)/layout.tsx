import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import ClientLayout from '@/components/ClientLayout';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Sprout SMS - Admin',
    description: 'School Management System',
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return (
        <ClientLayout session={session} sidebar={<Sidebar />}>
            {children}
        </ClientLayout>
    );
}
