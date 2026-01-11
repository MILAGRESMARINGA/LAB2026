# Deployment Guide

## Option 1: Docker Compose (Recommended for Dev/Small Scale)

This setup runs Frontend, Backend, and Postgres locally.

1.  **Configure Environment**:
    Copy `project/.env.example` to `project/.env` and fill in the Supabase keys.
    ```bash
    cp project/.env.example project/.env
    ```

2.  **Build and Run**:
    ```bash
    cd project
    docker-compose up --build
    ```

3.  **Access**:
    - Frontend: http://localhost:5173
    - Backend API: http://localhost:3333
    - Database (if local): localhost:5432

## Option 2: Production (Cloud)

### Database
- Use **Supabase Cloud** (managed Postgres).
- Run the migrations from `project/supabase/migrations/` in the Supabase SQL Editor.

### Backend (Node.js)
- Deploy `project/wpp-backend` to a container service (e.g., **Railway**, **Render**, **AWS App Runner**).
- **Environment Variables**:
    - `PORT`: 3000 (or provided by host)
    - `SUPABASE_URL`: Your Supabase URL
    - `SUPABASE_SERVICE_ROLE_KEY`: Your Service Role Key (Keep Secret!)
    - `TOKENS_DIR`: `/app/tokens` (Ensure persistent volume for tokens!)
    - `FRONTEND_ORIGIN`: Your production frontend domain (https://myapp.com)

### Frontend (React/Vite)
- Deploy `project/` to static hosting (e.g., **Vercel**, **Netlify**, **Cloudflare Pages**).
- **Build Settings**:
    - Command: `npm run build`
    - Output: `dist`
- **Environment Variables**:
    - `VITE_API_BASE`: URL of your deployed Backend (e.g., https://api.myapp.com)
    - `VITE_SUPABASE_URL`: Your Supabase URL
    - `VITE_SUPABASE_ANON_KEY`: Your Anon Key

## Rolling Updates (Backend)
To update the backend without losing sessions:
1. Ensure `TOKENS_DIR` is mounted on a persistent volume.
2. Deploy new container.
3. The new container will read existing tokens and reconnect sessions automatically.
