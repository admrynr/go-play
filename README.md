# Go-Play: PlayStation Rental SaaS Platform

Go-Play is a modern SaaS platform designed to digitize PlayStation Rental businesses. It provides a comprehensive dashboard for owners to manage stations, rates, and revenue, while offering players a seamless booking experience via personalized rental pages.

## 🚀 Tech Stack

### Frontend
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **UI Patterns**: Glassmorphism, Dark Mode, Mobile-First Design

### Backend
-   **BaaS**: [Supabase](https://supabase.com/)
-   **Database**: PostgreSQL
-   **Authentication**: Supabase Auth (Email/Password)
-   **Storage**: Supabase Storage

## 📂 Project Structure

-   `app/admin`: Protected routes for Super Admins and Rental Owners (Dashboards).
-   `app/[slug]`: Public dynamic routes for Rental Shop pages (Player View).
-   `app/api`: Server-side API routes (e.g., User Management).
-   `components`: Reusable UI components (Buttons, Cards, Modals).
-   `lib/supabase`: Supabase client configuration for Client/Server components.

## 🛠️ Getting Started

### Prerequisites
-   Node.js 18+
-   NPM or Yarn
-   A Supabase project (URL & Anon Key)

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
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_for_admin_api
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

5.  **Access the App**
    -   Public: `http://localhost:3000`
    -   Admin: `http://localhost:3000/login`

## 🔑 Key Features

### For Rental Owners
-   **Page Builder**: Customize your shop's online presence, choose from various templates.
-   **Station Management**: Track PS4/PS5 availability and manage live sessions.
-   **Rate Configuration**: Set hourly or packet-based pricing.
-   **POS & Cashier System**: Start/Stop timers, track F&B orders, handle Cash/QRIS payments.
-   **Loyalty System**: Implement "Buy 10 Get 1 Free" automated via WhatsApp.

### For Players
-   **Player Interface**: Scan station QR code to view live remaining time, bill, and order F&B.
-   **Live Status**: View real-time console availability on the public landing page.
-   **Easy Booking**: One-click WhatsApp booking integration.
-   **Earn Rewards**: Automatically receive free hour vouchers via WhatsApp.

## 📜 License
Private Software - All Rights Reserved.
