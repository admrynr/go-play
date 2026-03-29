# SPESIFIKASI MODUL BOOKING ONLINE (NEXT.JS & SUPABASE)
# PROJECT: SISTEM RENTAL PLAYSTATION HYBRID

Tolong buatkan logika dan alur untuk sistem booking online dengan pendekatan "Low Friction (Tanpa DP/Login)" dan "Strict Penalty (Sistem Blacklist)". 

## KONSTANTA WAKTU GLOBAL
Gunakan parameter waktu berikut untuk perhitungan ketersediaan meja:
- `BUFFER_TIME` = 5 Menit (Waktu bersih-bersih kasir antar sesi).
- `LEAD_TIME` = 10 Menit (Waktu minimal di depan untuk user online bisa booking).
- `GRACE_TIME` = 5 Menit (Toleransi keterlambatan maksimal bagi user online).

---

## 1. USER FLOW: BOOKING ONLINE (FRONTEND)
1. **Live Availability UI:**
   - Tampilkan grid/list unit PS dengan status: Hijau (Kosong), Merah (Dipakai - Loose), Kuning/Oranye (Reserved/Timed).
   - **Unit Timed:** Tampilkan label "Estimasi Tersedia: [HH:MM]".
   - **Unit Loose (Open Billing):** Tombol booking di-disable sepenuhnya (hanya label "In Use").
2. **Form Booking Cepat:**
   - User memilih: Unit, Jam Datang, dan Estimasi Durasi Main (Dropdown: 1 Jam, 2 Jam, dst).
   - Input Identitas: Hanya `Nama Panggilan` dan `Nomor WhatsApp`. Tidak ada pembuatan password.
3. **Post-Booking (Digital Ticket):**
   - Halaman sukses menampilkan "Tiket Booking" berisi Kode Unik (cth: BK-123) dan detail pesanan.
   - Instruksi di layar: *"Screenshot tiket ini dan tunjukkan ke kasir saat Anda tiba, atau cukup sebutkan Nomor WA Anda."*

---

## 2. ATURAN KETERSEDIAAN & WAKTU (CORE LOGIC)
1. **Perhitungan Slot Waktu Awal:**
   - Jika Unit Kosong: Waktu tercepat yang bisa dipilih adalah `Current_Time + LEAD_TIME (10 Menit)`.
   - Jika Unit Terpakai (Timed): Waktu tercepat adalah `Current_End_Time + BUFFER_TIME (5 Menit)`. (Pengecekan ini juga harus memastikan slot tersebut tidak melanggar `LEAD_TIME`).
2. **Argo Berjalan (Strict End Time):**
   - `End_Time` bersifat absolut. Jika user booking jam 14:00 untuk 2 jam, maka `End_Time` mutlak dikunci di 16:00. Keterlambatan check-in akan memotong durasi main user tersebut.
3. **Conflict Check (Validasi Ekstensi Waktu):**
   - Jika player *onsite* (sedang main) meminta perpanjangan waktu ke kasir, sistem harus memvalidasi jadwal. Jika waktu tambahan menabrak jadwal tiket booking user online, sistem menolak input kasir.

---

## 3. CHECK-IN, CHECKOUT & LOYALTY HOOK (ADMIN DASHBOARD)
1. **Proses Check-in (Klaim Tiket):**
   - User datang, admin mencari tiket berdasarkan `Kode Booking` atau `Nomor WA`.
   - Admin klik "Aktifkan Sesi". Status unit berubah dari `Reserved` menjadi `Active (Timed)`.
2. **Proses Checkout & Loyalty:**
   - Saat waktu habis, admin memproses pembayaran.
   - Sistem mengakumulasi jumlah jam main ke data `Nomor_WA` tersebut (Shadow Account logic).
   - **Loyalty Hook (UI Kasir):** Setelah pembayaran sukses, muncul notifikasi di layar Admin: *"Poin berhasil ditambahkan ke WA [Nomor]. Beritahu user untuk membuat password di website agar poin bisa ditukar reward."*

---

## 4. PENALTY SYSTEM: AUTO-CANCEL & BLACKLIST
Sistem harus menindak tegas "Prank Booking" atau No-Show:
1. **Cron/Realtime Check:** Pantau transaksi booking yang belum check-in.
2. **Auto-Cancel:** Jika waktu saat ini melebihi `Booking_Start_Time + GRACE_TIME (5 Menit)`, otomatis ubah status booking menjadi `Cancelled (No-Show)` dan bebaskan status unit (Available).
3. **Blacklist Update:** Flag `nomor_wa` tersebut di tabel `Users` dengan `is_blacklisted = TRUE`.
4. **Validasi Frontend:** Saat nomor yang di-blacklist mencoba booking ulang, tolak form submit dengan alert: *"Nomor Anda diblokir karena riwayat No-Show. Silakan datang ke lokasi untuk membuka blokir."*
5. **Admin Control:** Sediakan tombol "Pardon / Unblock" di dashboard admin untuk menghapus status blacklist.