# Go-Play: PlayStation Rental SaaS Platform Specification

## 1. Project Overview
**Go-Play** is a specialized SaaS (Software as a Service) platform designed to digitize and manage PlayStation Rental businesses ("Rental PS"). It serves three distinct user groups:
1.  **Super Admin (Platform Owner)**: Manages the SaaS platform, creates tenant accounts, and runs bulk onboarding campaigns.
2.  **Rental Owner (Tenant)**: Manages their specific rental shop, stations, rates, F&B menu, and monitors daily operations.
3.  **Player (End User)**: Browses rental profiles, checks station availability, books sessions, and orders F&B via QR code.

---

## 2. User Roles & Architecture

### A. Super Admin (Role: 1)
*   **Access:** `/admin` (Platform Dashboard)
*   **Capabilities:**
    *   **Tenant Management:** Create new rental owners (Tenants) individually via `/admin/tenants/create`, edit credentials, and manage subscription status.
    *   **Bulk Onboarding:** Upload a list of prospects via `/admin/onboarding` to batch-create unclaimed tenant profiles with dummy data for preview (scraped from Google Maps or similar).
    *   **Template Management:** Create and manage landing page templates that tenants can choose from via `/admin/templates`.
    *   **Platform Oversight:** View total templates and total tenants stats from the Admin Dashboard.
    *   **Access Control:** Super Admins manage all tenants via RLS (`role = 1` from JWT user_metadata).

### B. Rental Owner / Tenant (Role: 2)
*   **Access:** `/dashboard` (Rental Dashboard — redirected from `/login`)
*   **Login:** Supports login by **username** (resolved to email via `get_user_email_by_username` RPC) or direct email.
*   **Capabilities:**
    *   **Overview Dashboard:** View live stats — Total Stations, Active Sessions, Kitchen Orders, Today's Revenue — plus a 7-day SVG revenue trend chart.
    *   **Page Builder / Settings:** Customize public landing page (`/[slug]`) — business name, address, WhatsApp, Instagram, TikTok, operational hours, logo, theme colors, and select from available templates.
    *   **Station Management:** Add/edit/delete Consoles (PS4, PS5, etc.), set status (`idle`/`active`/`maintenance`), generate and print Station QR Codes.
    *   **POS & Sessions:** Start/Stop timer-based or open-billing sessions per station. Supports Cash and QRIS payment. Auto-calculates bill based on configured rates.
    *   **Rate Management:** Configure per-console-type **Hourly Rates** and **Packet Rates** (stored as JSON on `pages`).
    *   **Menu Management:** Add/edit/delete F&B menu items with categories (food, drink, snack, packet), pricing, and availability toggle.
    *   **Kitchen View:** Real-time F&B order queue via `/dashboard/kitchen` (powered by Supabase Realtime on `orders` and `order_items`).
    *   **Reports:** View historical sessions and revenue summaries via `/dashboard/reports`.
    *   **Loyalty System Configuration:** Toggle loyalty program on/off, set target hours (default: 10 hours).
    *   **Station Requests Panel:** See and resolve player requests (add time, stop session, call operator) from the dashboard in real-time.

### C. Player / End User (Public)
*   **Access:** `/[slug]` (Tenant Public Page)
*   **Capabilities:**
    *   **Browse Shop:** View business name, address, WhatsApp, Instagram, TikTok links, operational hours, facilities, rating, and reviews.
    *   **Live Availability:** See which stations are `idle`, `active`, or `maintenance` in real-time.
    *   **Booking:** Click "Book" on a console type → WhatsApp redirect with pre-filled booking message including business name and selected duration.
    *   **Player Interface** (via QR Scan → `/[slug]/station/[stationId]`):
        *   View live remaining time or current session billing.
        *   Place F&B orders from the shop's menu.
        *   Send station requests: Add Time, Stop Session, or Call Operator.
    *   **Loyalty:** Earn hours tracked by WhatsApp number. Auto-generate and redeem voucher codes (configurable target, default: 10 hours = 1 free hour voucher).

---

## 3. Bulk Onboarding & Claim Flow

This is a core growth mechanic for the platform.

### Onboarding Pipeline (Super Admin)
1.  Super Admin navigates to `/admin/onboarding`.
2.  Uploads a CSV/JSON of prospect rental shops (business_name, username, phone, rating, reviews, etc.).
3.  The system calls `/api/admin/onboarding` which batch-creates:
    *   A `tenants` record with `is_claimed = false`.
    *   A `pages` record with dummy data (stations, sessions, orders, menu items — all flagged `is_dummy = true`).
4.  Prospects are immediately accessible at `/preview/[slug]` for sales demos.

### Preview Dashboard (`/preview/[slug]`)
*   Publicly accessible (no login required) for unclaimed tenants.
*   Shows a fully functional-looking Rental Dashboard with dummy data to demonstrate value.
*   Includes a prominent **"Klaim Bisnis Ini"** (Claim This Business) call-to-action.

### Claim Flow (`/preview/[slug]/claim`)
1.  Prospect clicks "Klaim Bisnis Ini" from the preview page.
2.  Fills out a **Claim Form** with: Business Name, **Username** (editable, validated for uniqueness via `check_username_available` RPC), Phone, Email, and Password.
3.  Form **validates username availability** in real-time before submission.
4.  On submit, calls `/api/claim` which:
    *   Creates a new Supabase Auth user (email/password, role=2).
    *   Updates the `tenants` record: sets `user_id`, `is_claimed = true`, updates username if changed.
    *   Purges all `is_dummy = true` records (sessions, orders, order_items, station_requests, stations, menu_items).
    *   Updates the `pages` record with `owner_id`.
5.  Redirects the new tenant to `/dashboard` to begin real setup.

---

## 4. Tech Stack

### Frontend
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Lucide React (Icons)
*   **Components:** Custom components (`ImageUpload`, `EditableText`, template components) with a "Glassmorphism + Dark Mode Gaming" aesthetic.

### Backend & Database
*   **Platform:** Supabase (Backend-as-a-Service)
*   **Database:** PostgreSQL with Row Level Security (RLS)
*   **Auth:** Supabase Auth (Email/Password)
    *   **RBAC:** Custom `role` metadata in `auth.users` JWT (`1` = Super Admin, `2` = Tenant).
    *   **Username Login:** `get_user_email_by_username(username)` RPC resolves username → email before `signInWithPassword`.
*   **Realtime:** Supabase Realtime enabled on `sessions`, `orders`, `station_requests` for live dashboard updates.
*   **Storage:** Supabase Storage (`public_assets` bucket) for tenant logos and menu item images.
*   **RPCs / Functions:**
    *   `get_user_email_by_username(p_username)` — Secure username→email lookup.
    *   `check_username_available(username_to_check)` — Validates username uniqueness for claim/registration.

---

## 5. Database Schema

### Core Tables
| Table | Purpose |
|---|---|
| `tenants` | Bridges Auth user → Page. Holds `username`, `is_claimed`, `status`, `phone`, `rating`, `reviews`, loyalty config. |
| `pages` | Tenant's public profile. Holds slug, business metadata (name, address, WA, Instagram, TikTok, operational hours), theme, template, rates (JSON), logo URL. |
| `templates` | Global landing page layouts managed by Super Admin. |
| `stations` | Rental console units (name, type, status, QR URL). Has `is_dummy` flag. |
| `sessions` | Active/completed rental periods. Type: `open` (billing) or `timer` (prepaid). Tracks `total_amount`, `payment_method`, `voucher_code`. Has `is_dummy` flag. |
| `menu_items` | F&B catalog per tenant page. Has `is_dummy` flag. |
| `orders` | F&B orders tied to a session. Has `is_dummy` flag. |
| `order_items` | Line items within an order. Snapshot of price at order time. Has `is_dummy` flag. |
| `station_requests` | Player requests from QR scan: `add_time`, `stop_session`, `call_operator`. Has `is_dummy` flag. |
| `players` | Loyalty tracking per WhatsApp number per tenant. |
| `vouchers` | Free-hour vouchers generated by loyalty system. Status: `active`, `used`, `expired`. |

---

## 6. Key Workflows

### Tenant Onboarding (Manual — Super Admin)
1.  Super Admin logs in to `/admin`.
2.  Clicks "Create New Tenant" → `/admin/tenants/create`.
3.  Fills in email, password, username, business name.
4.  System creates Auth user + `tenants` + `pages` records.
5.  Tenant receives credentials and logs in directly.

### Bulk Onboarding (Super Admin)
1.  Super Admin navigates to `/admin/onboarding`.
2.  Uploads prospect data (batch).
3.  System creates unclaimed tenant profiles + dummy data.
4.  Sales team shares `/preview/[slug]` links to prospects.
5.  Prospect claims their profile via `/preview/[slug]/claim`.

### Daily Rental Operation (Tenant)
1.  Tenant logs in (by username or email) to `/dashboard`.
2.  Reviews Overview stats and revenue chart.
3.  Goes to `/dashboard/stations` to start a session.
4.  Selects station → picks rate (hourly/packet) → starts timer.
5.  Player scans QR → orders F&B → request comes to `/dashboard/kitchen`.
6.  At session end: staff stops session → bill calculated → Cash/QRIS payment recorded.
7.  F&B orders are tracked in `/dashboard/kitchen`, resolved when served.
8.  Revenue visible in `/dashboard/reports`.

### Booking (Player — Public Page)
1.  Player visits `go-play.com/[slug]`.
2.  Checks "Status Board" for available stations.
3.  Clicks "Book" on a console type, selects duration.
4.  Redirected to WhatsApp: "Halo, saya mau rental PS5 selama 2 Jam di [Business Name]..."

### Loyalty Redeem
1.  Tenant processes a session end with a voucher code at checkout.
2.  `/api/loyalty/redeem` verifies the code → marks `vouchers.status = 'used'`.
3.  `/api/loyalty/process` calculates earned hours and auto-generates voucher if target hit.

---

## 7. Directory Structure

```
/app
  /admin                  → Super Admin Dashboard (templates, tenants, onboarding)
  /dashboard              → Tenant Dashboard (overview, stations, menu, kitchen, reports, settings)
  /[slug]                 → Public Tenant Page (player view, status board)
    /station/[stationId]  → Player Interface (QR scan target: live timer, F&B order, requests)
  /preview
    /[slug]               → Preview Dashboard (unclaimed tenants, dummy data)
      /claim              → Claim Form (create account, validate username)
  /login                  → Login page (email or username)
  /api
    /admin/onboarding     → Bulk onboarding batch API
    /admin/users          → User management API
    /claim                → Claim flow API (create user, purge dummy data)
    /loyalty/process      → Loyalty hours processing
    /loyalty/redeem       → Voucher redemption
    /pages                → Page data API
    /upload               → File upload to Supabase Storage
/components
  ImageUpload.tsx         → Reusable image upload with Supabase Storage
  EditableText.tsx        → Inline editable text component
  /templates              → Template component implementations
/lib
  /supabase               → Supabase client (client + server + admin)
  /utils                  → Utility functions (slugify, etc.)
/supabase/migrations      → 15 incremental SQL migrations
/scripts                  → Utility scripts
```