# CRMIMOBI System

This repository contains the full source code for the CRMIMOBI system, featuring a React Frontend and a Node.js WhatsApp Backend.

## Architecture

- **Frontend**: Vite + React + TypeScript
- **Backend**: Node.js + Express + WPPConnect + Socket.IO
- **Database**: Supabase (PostgreSQL)

## Quick Start (Local)

1.  **Prerequisites**: Node.js 18+, Docker (optional).
2.  **Setup**:
    ```bash
    cd project
    cp .env.example .env
    # Edit .env with your Supabase Keys
    ```
3.  **Install Dependencies**:
    ```bash
    cd project
    npm install
    cd wpp-backend
    npm install
    cd ..
    ```
4.  **Run with Docker**:
    ```bash
    docker-compose up --build
    ```
    **OR Run Manually**:
    - Term 1 (Backend): `cd wpp-backend && npm run dev`
    - Term 2 (Frontend): `npm run dev`

## Documentation

- [Deployment Guide](deploy.md)
- [Security Checklist](SECURITY.md)
- [Implementation Report](IMPLEMENTATION_REPORT.md)

## Features

- **Multi-user WhatsApp**: Each user gets their own isolated WhatsApp session.
- **Real-time Status**: QR Codes and connection status stream via WebSockets.
- **Secure Logging**: All messages are logged to Supabase `whatsapp_messages` table.
- **Properties Module**: Manage Real Estate inventory (Supabase).