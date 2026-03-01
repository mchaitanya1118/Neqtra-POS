// Use absolute URL from env in production to avoid Next.js rewrite issues via Traefik.
export const API_URL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "/api";
