# LAB deployment checklist
1. Create a NEW Supabase project exclusively for LAB; do not point at CRMIMOBI.
2. Review SQL migration and RLS with security-engineer; apply to LAB only.
3. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (publishable key only). Never expose service-role credentials.
4. In lab-app run npm install, npm test, npm run build.
5. Configure hosting root directory lab-app and SPA fallback.
6. Validate auth, completion persistence, backups, accessibility and privacy in staging before production.
7. Merge reconstruction branch only after CRMIMOBI cleanup and CI approval.
