# Go-Play: PlayStation Rental SaaS Platform

Go-Play is a modern SaaS platform designed to digitize PlayStation Rental businesses. It provides a comprehensive dashboard for rental owners to manage stations, rates, F&B menus, and revenue — while offering players a seamless booking and in-session experience via personalized rental pages and QR codes. A built-in bulk onboarding pipeline lets the platform quickly demo value to prospects and convert them into paying tenants.

## 🚀 Tech Stack

### Frontend
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **UI Patterns**: Glassmorphism, Dark Mode, Mobile-First Design

### Backend
-   **BaaS**: [Supabase](https://supabase.com/)
-   **Database**: PostgreSQL with Row Level Security (RLS)
-   **Authentication**: Supabase Auth (Email/Password + Username Login via RPC)
-   **Realtime**: Supabase Realtime (sessions, orders, station requests)
-   **Storage**: Supabase Storage (`public_assets` bucket for logos & menu images)

## 📂 Project Structure

```
/app
  /admin               → Super Admin Dashboard (templates, tenants, bulk onboarding)
  /dashboard           → Tenant Dashboard (overview, stations, menu, kitchen, reports, settings)
  /[slug]              → Public tenant page (player view, live status board, QR player interface)
  /preview/[slug]      → Preview dashboard for unclaimed prospects (with dummy data)
    /claim             → Claim flow (prospect → tenant account creation)
  /login               → Login page (email or username)
  /api                 → Server-side API routes
/components            → Reusable UI (ImageUpload, EditableText, templates)
/lib/supabase          → Supabase client (client, server, admin)
/supabase/migrations   → 15 incremental SQL migrations
```

## 🛠️ Getting Started

### Prerequisites
-   Node.js 18+
-   NPM or Yarn
-   A Supabase project (URL & Anon Key & Service Role Key)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/go-play.git
    cd go-play
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_admin_api
    ```

4.  **Run Migrations**
    Apply all migrations in `/supabase/migrations` to your Supabase project via the Supabase CLI or Dashboard SQL editor.

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

6.  **Access the App**
    -   Public Player View: `http://localhost:3000/[slug]`
    -   Login: `http://localhost:3000/login`
    -   Tenant Dashboard: `http://localhost:3000/dashboard`
    -   Super Admin: `http://localhost:3000/admin`
    -   Prospect Preview: `http://localhost:3000/preview/[slug]`

## 🔑 Key Features

### For Super Admin
-   **Admin Dashboard**: Overview of total templates and tenants.
-   **Tenant Management**: Create individual tenant accounts (`/admin/tenants/create`).
-   **Bulk Onboarding**: Upload batch prospect data to create unclaimed profiles with dummy data (`/admin/onboarding`). Share `/preview/[slug]` links for sales demos.
-   **Template Management**: Create and manage landing page templates for tenants.

### For Rental Owners (Tenants)
-   **Username Login**: Log in using a unique username (resolved to email via secure RPC).
-   **Overview Dashboard**: Live stats — active sessions, kitchen orders, today's revenue — plus a 7-day SVG revenue trend chart.
-   **Page Builder / Settings**: Customize public page — business name, address, WhatsApp, Instagram, TikTok, operational hours, logo, theme colors, and template.
-   **Station Management**: Add PS4/PS5 consoles, manage status, generate and print QR codes.
-   **POS & Session Management**: Start/stop timer or open-billing sessions, support Cash/QRIS payment.
-   **Rate Configuration**: Set per-console-type hourly rates and packet rates.
-   **Menu Management**: Full F&B catalog — categories (food, drink, snack, packet), images, pricing, availability toggle.
-   **Kitchen View**: Real-time F&B order queue with live updates via Supabase Realtime.
-   **Station Requests Panel**: Receive and resolve player requests (add time, stop session, call operator) in real-time.
-   **Reports**: Historical session and revenue summaries.
-   **Loyalty System**: Configurable "Buy X hours, Get 1 Free" program with voucher code generation and redemption.

### For Players (Public)
-   **Public Rental Page** (`/[slug]`): View shop info, contact links (WA, Instagram, TikTok), operational hours, rating, reviews, and live station availability.
-   **Live Status Board**: Real-time console status (idle / active / maintenance).
-   **Easy Booking**: One-click WhatsApp booking with pre-filled message.
-   **QR Player Interface** (`/[slug]/station/[id]`): Scan QR at station to see live session timer/billing, place F&B orders, and send station requests.
-   **Loyalty Rewards**: Hours tracked per WhatsApp number; auto-receive free hour vouchers upon hitting the target.

### Bulk Onboarding & Claim Flow
1.  Super Admin batch-creates unclaimed tenant profiles with dummy data.
2.  Prospects view their pre-built rental page at `/preview/[slug]`.
3.  Prospect fills Claim Form (with unique username validation) → new Supabase Auth account created.
4.  All dummy data is purged, tenant is redirected to their real dashboard.

## 📜 License
Private Software - All Rights Reserved.
