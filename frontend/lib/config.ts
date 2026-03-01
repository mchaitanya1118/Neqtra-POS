export const API_URL = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL  // Direct to backend root in production
    : "/api"; // Use Next.js proxy rewrite in local development
