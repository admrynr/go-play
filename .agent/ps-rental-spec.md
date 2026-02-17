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
    *   **Platform Oversight:** View all registered pages and aggregated stats.
    *   **Access Control:** Super Admins can "impersonate" or manage specific tenant settings if needed (requires Super Admin password verification for sensitive actions).

### B. Rental Owner / Tenant (Role: 2)
*   **Access:** `/admin` (Rental Dashboard)
*   **Capabilities:**
    *   **Page Builder:** Customize their public landing page (`/[slug]`) with business name, address, WhatsApp, and theme colors.
    *   **Station Management:** Manage inventory of Consoles (PS4, PS5, etc.) and TVs.
    *   **Rate Management:** Configure granular rental rates:
        *   **Hourly Rates:** Per console type (e.g., PS5 = 15k/hr, PS4 = 10k/hr).
        *   **Packet Rates:** Session-based (e.g., "3 Hours Pass", "Night Packet").
    *   **Shift Management:** POS-like features to Open/Close shifts and track daily revenue.
    *   **Order Management:** (Future) Simple food/drink ordering system integration.

### C. Player / End User (Public)
*   **Access:** `/[slug]` (Tenant Public Page)
*   **Capabilities:**
    *   **Browse Shop:** View the rental shop's location, facilities, and available consoles.
    *   **Live Availability:** See which stations are "Available", "In Use", or "Offline" (Real-time Status Board).
    *   **Booking:** Select a console type and duration to initiate a booking via WhatsApp (automated message generation).

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
2.  **`pages`**: Represents a Tenant/Rental Shop.
    *   `owner_id`: Link to User.
    *   `slug`: Unique URL identifier.
    *   `business_name`, `address`, `whatsapp_number`: Business info.
    *   `theme_color`: Branding.
3.  **`consoles` / `stations`**:
    *   `page_id`: Tenant ownership.
    *   `name`: "TV 1", "VIP 2".
    *   `type`: "PS4", "PS5".
    *   `status`: "available", "rented".
4.  **`rental_rates`**:
    *   JSON-based structure or relational table for flexible pricing (Hourly vs Packets).
5.  **`shifts` & `transactions`**:
    *   For financial tracking and cashier operations.

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