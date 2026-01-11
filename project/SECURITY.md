# Security Checklist

- [ ] **HTTPS**: Configure SSL/TLS for all public endpoints (Frontend & Backend).
- [ ] **Supabase Keys**:
    - `SUPABASE_ANON_KEY`: Safe for Frontend.
    - `SUPABASE_SERVICE_ROLE_KEY`: **BACKEND ONLY**. Never commit to git or expose to client.
- [ ] **JWT Validation**: Ensure backend verifies JWT signature against Supabase JWKS.
- [ ] **Rate Limiting**: Enable rate limiting on WPP Backend (using Nginx or express-rate-limit).
- [ ] **Data Isolation**: All database queries must respect RLS policies via `auth.uid()`.
- [ ] **Audit**: Monitor `whatsapp_messages` table for suspicious activity.
