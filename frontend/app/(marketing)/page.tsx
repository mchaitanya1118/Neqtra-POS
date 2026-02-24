import dynamic from 'next/dynamic';
import { Hero } from '@/components/marketing/Hero';

const Features = dynamic(() => import('@/components/marketing/Features').then(mod => mod.Features), {
    loading: () => <div className="py-24 animate-pulse bg-surface/10 h-[600px]" />
});

const Pricing = dynamic(() => import('@/components/marketing/Pricing').then(mod => mod.Pricing), {
    loading: () => <div className="py-24 animate-pulse h-[600px]" />
});

export default function LandingPage() {
    return (
        <>
            <Hero />
            <Features />
            <Pricing />
        </>
    );
}
