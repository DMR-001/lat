import './website.css';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';

export const metadata = {
    title: 'Sprout School - Little Leaders Learning Hub',
    description: 'Premier pre-primary and primary school in Hyderabad focused on holistic child development.',
};

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="website-body">
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 80px - 300px)' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
}
