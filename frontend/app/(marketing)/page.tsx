import dynamic from 'next/dynamic';
import { Hero } from '@/components/marketing/Hero';

const Features = dynamic(() => import('@/components/marketing/Features').then(mod => mod.Features), {
    loading: () => <div className="py-24 animate-pulse bg-gray-50 h-[600px]" />
});

const Testimonials = dynamic(() => import('@/components/marketing/Testimonials').then(mod => mod.Testimonials), {
    loading: () => <div className="py-24 animate-pulse bg-white h-[400px]" />
});

const Pricing = dynamic(() => import('@/components/marketing/Pricing').then(mod => mod.Pricing), {
    loading: () => <div className="py-24 animate-pulse bg-gray-50 h-[600px]" />
});

export default function LandingPage() {
    return (
        <div className="bg-white min-h-screen">
            <Hero />
            <Features />
            <Testimonials />
            <Pricing />
        </div>
    );
}
