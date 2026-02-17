# PROJECT: GO-PLAY PLATFORM (SAAS PS RENTAL MANAGEMENT)

## 1. PLATFORM OVERVIEW
**Go-Play** is a comprehensive SaaS platform for PlayStation Rental businesses. It connects Rental Owners, Their Staff (Operators/Kitchen), and End-Users (Players).

### Core Ecosystem
1.  **Public Landing Page (Go-Play B2B)**: Sales page for Rental Owners to sign up.
2.  **Super Admin Dashboard**: For Go-Play owners to manage tenants/subscriptions.
3.  **Rental Admin Dashboard**: The core product for Rental Owners (POS, Station Management, Simple CRM).
4.  **Player Interface (Mobile Web)**: Accessed via QR Code at each station for self-service.

---

## 2. USER ROLES & JOURNEYS

### A. Rental Owner (Tenant)
- **Goal**: Manage stations, track revenue, receive food orders.
- **Key Features**:
    - **Station Management**: Create/Edit stations (e.g., "TV 1", "VIP Room").
    - **Menu Management**: Add food/drinks with prices and photos.
    - **Active Session View**: See which stations are active, time remaining, and billing type.
    - **Kitchen View**: Receive real-time orders from players.
    - **QR Generator**: Print unique QR codes for each station.
    - **Landing Page Builder**: Customize their public rental website (Hero, Contact, Pricing).

### B. Player (End-User)
- **Goal**: Order food, check time, request help without shouting.
- **Journey**:
    1.  Sit at Station (TV 1).
    2.  Scan QR Code on the table.
    3.  Open Web App (No install required).
    4.  **View**: Time Remaining (if timer) / Time Elapsed (if billing).
    5.  **Action**: "Order Food" -> Browse Menu -> Add to Cart -> Order.
    6.  **Action**: "Call Operator" -> Request assistance.
    7.  **Action**: "Tambah Waktu" -> Request extension.

### C. Super Admin (Go-Play Owner)
- **Goal**: Manage the SaaS platform.
- **Key Features**:
    - Create/Suspend Rental Owner accounts.
    - Global Template Management.

---

## 3. FEATURE SPECIFICATIONS

### [MODULE 1: RENTAL ADMIN DASHBOARD]
**URL**: `/dashboard`
- **Station Grid**:
    - Cards representing TV/Consoles.
    - Status Indicators: Idle (Green), Active (Blue), Cleaning/Maintenance (Red).
    - Quick Actions: Start Session, Stop Session, Add Order.
- **Order Management**:
    - Incoming orders from QR codes.
    - Notification sound for new orders.
    - Status: Pending -> Preparing -> Served -> Paid.
- **Billing System**:
    - **Pre-paid (Timer)**: Auto-stop or alert when time ends.
    - **Post-paid (Open/Loose)**: Count up timer, stop to calculate final bill.

### [MODULE 2: PLAYER INTERFACE]
**URL**: `/[slug]/station/[station_id]`
- **Design**: Mobile-first, Dark Mode, High Contrast.
- **Home Screen**:
    - Large Timer Display.
    - "Bill So Far" (Estimated).
    - Quick Buttons: [Menu] [Call Staff] [Extend].
- **F&B Menu**:
    - Categories (Drinks, Snacks, Meals).
    - Add to Cart -> Confirm Order.

### [MODULE 3: PUBLIC RENTAL SITE]
**URL**: `/[slug]`
- **Content**: Generated from the Rental Admin settings.
- **Sections**: Hero, Unit Variants (PS4/PS5), Pricing, Location, Contact.
- **Design**: StoryBrand Template (Dark/Gaming Theme).

---

## 4. TECHNICAL ARCHITECTURE

### Database Schema (Supabase)
1.  **tenants** (users/owners): linked to `auth.users`.
2.  **pages** (websites): stores branding, theme, contact info.
3.  **stations**: `id`, `page_id`, `name`, `type`, `qr_code_url`.
4.  **menu_items**: `id`, `page_id`, `name`, `price`, `category`, `image`, `is_available`.
5.  **sessions**: `id`, `station_id`, `start_time`, `end_time`, `type` (timer/open), `status`.
6.  **orders**: `id`, `session_id`, `total`, `status` (pending/served/paid).
7.  **order_items**: `id`, `order_id`, `menu_item_id`, `qty`, `price`.

### Security (RLS)
- **Tenants**: Can only access data with their `page_id` / `owner_id`.
- **Players**: Can only access `sessions` and `menu_items` linked to their scanned `station_id`.