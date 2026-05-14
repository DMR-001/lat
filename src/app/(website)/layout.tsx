import './website.css';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';

export const metadata = {
    title: 'Sprout School — Little Leaders Learning Hub | Meerpet, Hyderabad',
    description: 'Top pre-primary and primary school in Meerpet, Hyderabad. Playgroup, Nursery, LKG, UKG & Grades 1–5. CBSE-aligned, safe & nurturing environment. Admissions open 2025–26.',
    keywords: 'Sprout School Meerpet, pre-primary school Hyderabad, primary school Meerpet, nursery school Hyderabad, best school near Meerpet',
    openGraph: {
        title: 'Sprout School — Nurturing Little Leaders',
        description: 'A joyful, safe, and stimulating school in Meerpet, Hyderabad for children from Playgroup to Grade 5.',
        siteName: 'Sprout School',
    },
};

export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="website-body">
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 76px - 360px)' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
}
