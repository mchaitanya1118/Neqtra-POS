// Always route through Next.js proxy (/api) to avoid CORS issues in production 
// and centralize backend URL resolution to next.config.ts
export const API_URL = "/api";
