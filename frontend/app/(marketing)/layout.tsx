import { Navbar } from '@/components/marketing/Navbar';
import { Footer } from '@/components/marketing/Footer';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-white text-black selection:bg-[#6366F1]/30 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 bg-white pt-[72px]">
                {children}
            </main>
            <Footer />
        </div>
    );
}
