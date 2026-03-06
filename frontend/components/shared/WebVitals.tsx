"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
    useReportWebVitals((metric) => {
        // Only log the critical Core Web Vitals to keep the console clean
        if (['FCP', 'LCP', 'CLS', 'FID', 'TTFB', 'INP'].includes(metric.name)) {
            console.log(`[%cWeb Vitals%c] ${metric.name}: %c${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}%c (Rating: ${metric.rating})`,
                'color: #22c55e; font-weight: bold;',
                'color: inherit;',
                `color: ${metric.rating === 'good' ? '#22c55e' : metric.rating === 'needs-improvement' ? '#eab308' : '#ef4444'}; font-weight: bold;`,
                'color: inherit;'
            );
        }
    });

    return null;
}
