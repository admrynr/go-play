# PROJECT: PS-BOX PORTABLE RENTAL LANDING PAGE
# BASE REFERENCE: https://videogametemplate.webflow.io/home
# THEME: High-End Gaming / Dark Mode / Blue Accent

## 1. GLOBAL VISUAL STYLE
- **Background:** Dark Charcoal (#0A0A0A) with Subtle Radial Gradients.
- **Accent Color:** PlayStation Blue (#003791) for buttons, borders, and icons.
- **Typography:** - Headings: 'Inter' or 'Montserrat', Bold, Uppercase (for a rugged gaming look).
    - Body: 'Inter', Regular, Light Grey (#A1A1A1).
- **Radius:** 12px for all cards and buttons.
- **Glow Effect:** Apply #003791 box-shadow (0 0 15px) on hover for primary components.

## 2. COMPONENT ARCHITECTURE & CONTENT PIVOT

### [SECTION 1: NAVBAR]
- **Logo:** [PS-BOX LOGO]
- **Links:** Layanan, Pilihan Box, Harga, FAQ.
- **CTA Button:** "Sewa Sekarang" (Solid Blue).

### [SECTION 2: HERO - THE HOOK]
- **Visual:** Image of a portable gaming box (integrated screen + PS5).
- **Headline:** "Gaming Tanpa Batas, Di Mana Saja."
- **Sub-headline:** "Sewa Box PS Portable All-in-One. Plug & Play lengkap dengan TV 4K, PS5, dan Controller. Siap kirim ke lokasi Anda."
- **Buttons:** [Primary: Cek Ketersediaan] [Secondary: Lihat Video Demo].

### [SECTION 3: PRODUCT GRID - PILIHAN BOX]
(Ubah 'Game Modes' menjadi 'Varian Box')
- **Card 1 (The Titan):** Image: PS5 Box + TV 32". Text: "Box PS5 Ultimate - Pengalaman 4K murni untuk hardcore gamer."
- **Card 2 (The Scout):** Image: PS4 Pro Box + TV 24". Text: "Box PS4 Pro - Ringkas, tangguh, dan ekonomis untuk nongkrong."
- **Card 3 (Event Pack):** Image: Multiple Boxes. Text: "Event Bundle - Solusi turnamen dan gathering komunitas."

### [SECTION 4: FEATURE BREAKDOWN - WHY US?]
(Ubah 'Infinite Galaxy' section menjadi 'Tech Specs')
- **Feature 1:** "Cooling System Pro" - Box dilengkapi fan industrial agar PS tidak overheat.
- **Feature 2:** "Instant Setup" - Hanya butuh 1 kabel power, langsung main dalam 30 detik.
- **Feature 3:** "Premium Hardware" - Monitor low-latency & Controller original.

### [SECTION 5: PRICING & RENTAL TERMS]
(Ubah 'Blog/News' menjadi 'Daftar Harga')
- **Layout:** Vertical Cards.
- **Options:** - Paket 12 Jam: RpXXX.000
    - Paket 24 Jam: RpXXX.000
    - Paket Weekend: RpXXX.000

### [SECTION 6: FOOTER & SOCIALS]
- **Content:** Alamat Workshop, WhatsApp Link, Instagram, TikTok.
- **Badge:** "Ready to Play? Hubungi Admin via WhatsApp."

## 3. INTERACTIVE LOGIC
- **CTA Actions:** Semua tombol "Sewa Sekarang" arahkan langsung ke WhatsApp API dengan template pesan: "Halo Admin, saya mau sewa [Nama Paket] untuk tanggal [Input Tanggal]."
- **Hover States:** Semua card produk harus memiliki efek `transform: translateY(-10px)` saat di-hover.