# Go-Play: PlayStation Rental SaaS Platform Specification

## 1. Project Overview
**Go-Play** is a specialized SaaS (Software as a Service) platform designed to digitize and manage PlayStation Rental businesses ("Rental PS"). It serves three distinct user groups:
1.  **Super Admin (Platform Owner)**: Manages the SaaS platform, creates tenant accounts.
2.  **Rental Owner (Tenant)**: Manages their specific rental shop, stations, rates, and cash flow.
3.  **Player (End User)**: Browses rental profiles, checks station availability, and books sessions.

## 2. User Roles & Architecture

### A. Super Admin (Role: 1)
*   **Access:** `/admin` (Platform Dashboard)
*   **Capabilities:**
    *   **Tenant Management:** Create new rental owners (Tenants), edit credentials, and manage subscription status.
    *   **Template Management:** Create and manage landing page templates that tenants can choose from.
    *   **Platform Oversight:** View all registered pages and aggregated stats.
    *   **Access Control:** Super Admins can "impersonate" or manage specific tenant settings if needed (requires Super Admin password verification for sensitive actions).

### B. Rental Owner / Tenant (Role: 2)
*   **Access:** `/admin` (Rental Dashboard)
*   **Capabilities:**
    *   **Page Builder:** Customize their public landing page (`/[slug]`) with business name, address, WhatsApp, theme colors, and select from available templates.
    *   **Station Management:** Manage inventory of Consoles, print Station QR Codes for Players.
    *   **Rate Management:** Configure granular rental rates:
        *   **Hourly Rates:** Per console type (e.g., PS5 = 15k/hr, PS4 = 10k/hr).
        *   **Packet Rates:** Session-based (e.g., "3 Hours Pass", "Night Packet").
    *   **POS & Dashboard:** Start/Stop timers, manage active sessions, calculate billing (Cash/QRIS).
    *   **F&B Order Management:** Receive and process food/drink orders directly from the Player Interface.
    *   **Loyalty System:** Automatically track customer hours via WhatsApp, generate and redeem "Buy 10 Get 1 Free" vouchers.

### C. Player / End User (Public)
*   **Access:** `/[slug]` (Tenant Public Page)
*   **Capabilities:**
    *   **Browse Shop:** View the rental shop's location, facilities, and available consoles.
    *   **Live Availability:** See which stations are "Available", "In Use", or "Offline" (Real-time Status Board).
    *   **Booking:** Select a console type and duration to initiate a booking via WhatsApp.
    *   **Player Interface:** Scan a Station's QR Code to view remaining live time, order food & beverages, and check current session billing.
    *   **Loyalty:** Earn points and receive automated WhatsApp notifications with free hour vouchers when targets are hit.

## 3. Tech Stack

### Frontend
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Lucide React (Icons)
*   **Components:** Custom components (Cards, Modals, Forms) with a focus on "Glassmorphism" and "Dark Mode" gaming aesthetics.

### Backend & Database
*   **Platform:** Supabase (Backend-as-a-Service)
*   **Database:** PostgreSQL
*   **Auth:** Supabase Auth (Email/Password)
    *   **Role-Based Access Control (RBAC):** Custom `role` metadata in `auth.users` (1=Super Admin, 2=Tenant).
*   **Storage:** Supabase Storage (for tenant logos, game covers).

## 4. Database Schema Highlights

### Core Tables
1.  **`users`**: Extends `auth.users` (managed via Supabase Auth).
2.  **`tenants`**: Logical separation bridging Users and Pages. Uses a unique `username` (acts as the URL slug).
3.  **`pages`**: Represents a Tenant's highly customized public facing profile.
    *   `tenant_id`: Link to Tenants.
    *   `template_id`: Selected Landing Page Template.
4.  **`templates`**: Global landing page layouts managed by Super Admin.
5.  **`stations`**: Rental seats (e.g., "TV 1", "VIP 2").
6.  **`sessions`**: Active tracking of a rental period (timer/open billing) linked to a station.
7.  **`orders`**: F&B purchases tied to an active session.
8.  **`players` & `vouchers`**: Loyalty system tracking accumulated hours per WhatsApp number and active free-hour vouchers.

## 5. Key Workflows

### Tenant Onboarding (Super Admin)
1.  Super Admin logs in.
2.  Creates a new User (Email/Pass) + Page (Business Name) via `/admin/websites/create`.
3.  System generates a unique `slug` (e.g., `go-play.com/rental-adam`).
4.  Tenant receives credentials.

### Rental Management (Tenant)
1.  Tenant logs in to `/admin`.
2.  Updates Profile in "Page Builder".
3.  Adds Consoles in "Stations".
4.  Sets Pricing in "Rates".
5.  (Daily) Opens Shift to start earning.

### Booking (Player)
1.  Player visits `go-play.com/[slug]`.
2.  Checks "Status Board" for empty seats.
3.  Clicks "Book" on a PS5.
4.  Selects "2 Hours".
5.  Redirects to WhatsApp: "Halo, saya mau rental PS5 selama 2 Jam di [Business Name]..."

## 6. Directory Structure
*   `/app/admin`: Authenticated routes for Super Admin and Tenants.
    *   `layout.tsx`: Handles Auth checks and Sidebar navigation.
*   `/app/[slug]`: Public routes for Tenant Pages.
*   `/components`: Reusable UI elements.
*   `/lib/supabase`: Supabase client initialization (Client & Server components).