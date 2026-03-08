import Link from 'next/link';
import {
  Gamepad2, Monitor, QrCode, TrendingUp, ChevronRight,
  CheckCircle2, AlertTriangle, DollarSign, ChefHat, ShieldOff,
  Clock, LayoutDashboard, Smartphone, Trophy, Zap, Users,
  MessageCircle, Instagram
} from 'lucide-react';

const WA_LINK = "https://wa.me/6289688578285?text=halo%20saya%20ingin%20request%20demo%20go-play";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-wider">GO-PLAY</span>
          </div>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-sm font-medium"
            >
              Login
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(0,55,145,0.5)] transition-all text-sm"
            >
              Request Demo
            </a>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/20 blur-[130px] rounded-full opacity-40 pointer-events-none" />

        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Platform SaaS #1 untuk Pengusaha Rental PS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Stop Kebocoran Pendapatan.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Kelola Rental PS Secara Digital.
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Banyak pemilik rental PS kewalahan mengelola sesi dan keuangan secara manual yang rawan kebocoran.
            Go-Play menyediakan sistem otomatis untuk memantau stasiun, pesanan F&B, dan pendapatan secara real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,55,145,0.4)] flex items-center justify-center gap-2"
            >
              Request Demo Gratis <ChevronRight className="w-5 h-5" />
            </a>
            <Link
              href="#fitur"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Pelajari Fitur
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. SOCIAL PROOF ── */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Rental Terdaftar', value: '500+' },
              { label: 'Transaksi Diproses', value: '10k+' },
              { label: 'Uptime Server', value: '99.9%' },
              { label: 'Support', value: '24/7' },
            ].map((s, i) => (
              <div key={i}>
                <h3 className="text-3xl font-bold text-white mb-1">{s.value}</h3>
                <p className="text-gray-500 text-sm uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. STAKES (The Pain) ── */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-bold tracking-widest uppercase">Masalah</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
              Masih Terjebak Manajemen<br />Manual yang Berisiko?
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-blue-400 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: ShieldOff,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                title: 'Manipulasi Data',
                desc: 'Pembukuan manual sangat rawan dimanipulasi oleh staf atau pelanggan tanpa bisa dilacak.'
              },
              {
                icon: DollarSign,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                title: 'Revenue Leakage',
                desc: 'Kehilangan uang akibat durasi sewa yang tidak tercatat secara presisi — menit demi menit terkuras.'
              },
              {
                icon: ChefHat,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                title: 'F&B Loss',
                desc: 'Pesanan makanan dan minuman sering terlewat atau lupa ditagihkan saat sesi berakhir.'
              },
              {
                icon: AlertTriangle,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                title: 'Operational Stress',
                desc: 'Anda tidak bisa meninggalkan toko karena tidak ada sistem pemantauan yang andal.'
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-5 p-6 bg-surface border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                <div className={`p-3 ${item.bg} rounded-xl shrink-0 h-fit`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. VALUE PROPOSITION ── */}
      <section className="py-20 px-6 bg-surface border-y border-white/5">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-primary text-sm font-bold tracking-widest uppercase">Solusi</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3">Satu Platform, Tiga Dampak Nyata</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10 border-blue-500/20',
                title: 'Timer Otomatis',
                desc: 'Billing yang mengunci durasi secara akurat untuk meminimalisir human error dan selisih tagihan.'
              },
              {
                icon: ChefHat,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10 border-orange-500/20',
                title: 'Kitchen Display',
                desc: 'Pesanan F&B dari pemain via QR masuk langsung ke antrean dapur secara real-time — tidak ada yang terlewat.'
              },
              {
                icon: TrendingUp,
                color: 'text-green-400',
                bg: 'bg-green-500/10 border-green-500/20',
                title: 'Laporan Instan',
                desc: 'Pantau total pendapatan harian dan mingguan melalui grafik SVG yang mudah dipahami, kapan saja.'
              },
            ].map((item, i) => (
              <div key={i} className={`p-8 border rounded-2xl ${item.bg} text-center`}>
                <div className="flex justify-center mb-5">
                  <div className="p-4 bg-white/5 rounded-2xl">
                    <item.icon className={`w-10 h-10 ${item.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. GUIDE (Empathy & Authority) ── */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Platform Terpercaya</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Kami Mengerti Betapa Melelahkannya<br />Mengawasi Operasional Rental Setiap Saat.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Anda tidak seharusnya harus ada di tempat setiap jam demi memastikan bisnis berjalan jujur.
            <span className="text-white font-semibold"> Go-Play adalah platform SaaS yang didesain khusus</span> untuk
            mendigitalisasi operasional Rental PS — mengamankan setiap menit, setiap pesanan, dan setiap rupiah profit Anda.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            {['Anti-Manipulasi', 'Real-time Monitor', 'Auto-Report', 'Desain Khusus Rental PS'].map((badge, i) => (
              <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FEATURES DEEP-DIVE ── */}
      <section id="fitur" className="py-28 px-6 bg-surface border-y border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-bold tracking-widest uppercase">Fitur Lengkap</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Semua yang Anda Butuhkan</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Dari billing hingga dapur, dari pemain hingga laporan — semuanya satu platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Tenant Features */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-primary/20 rounded-xl">
                  <LayoutDashboard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Untuk Pemilik Rental</h3>
                  <p className="text-gray-500 text-sm">Kontrol penuh, skalabilitas tinggi</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, title: 'Dashboard & Revenue Chart', desc: 'Statistik real-time & grafik tren pendapatan 7 hari.' },
                  { icon: Monitor, title: 'Smart POS & Stations', desc: 'Kelola konsol PS4/PS5, sesi timer & open-billing otomatis.' },
                  { icon: ChefHat, title: 'Menu F&B & Kitchen View', desc: 'Katalog digital + antrean pesanan real-time di layar dapur.' },
                  { icon: Zap, title: 'Station Requests', desc: 'Terima permintaan tambah waktu atau panggil operator di dashboard.' },
                  { icon: Smartphone, title: 'Page Builder', desc: 'Kustomisasi halaman publik: logo, warna, sosmed, jam buka.' },
                  { icon: Trophy, title: 'Loyalty System', desc: 'Program poin otomatis per WA + auto-generate voucher gratis.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 bg-background rounded-xl border border-white/5 hover:border-primary/30 transition-colors">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{item.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Player Features */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-green-500/20 rounded-xl">
                  <Users className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Untuk Pemain</h3>
                  <p className="text-gray-500 text-sm">Pengalaman gaming yang profesional</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { icon: Monitor, title: 'Public Page & Live Status', desc: 'Cek info rental & ketersediaan konsol real-time dari rumah.' },
                  { icon: MessageCircle, title: 'WhatsApp Booking', desc: 'Satu klik kirim pesan pemesanan yang sudah terisi otomatis.' },
                  { icon: QrCode, title: 'Player Interface (QR Scan)', desc: 'Pantau sisa waktu & tagihan live di HP masing-masing.' },
                  { icon: ChefHat, title: 'Digital Ordering', desc: 'Pesan makanan dan kirim permintaan bantuan dari tempat duduk.' },
                  { icon: Trophy, title: 'Loyalty Rewards', desc: 'Akumulasi jam bermain per WA — dapat voucher jam gratis otomatis.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 bg-background rounded-xl border border-white/5 hover:border-green-500/30 transition-colors">
                    <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
                      <item.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{item.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. THE PLAN ── */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-primary text-sm font-bold tracking-widest uppercase">Cara Mulai</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3">3 Langkah Mudah</h2>
            <p className="text-gray-400 mt-4">Dari nol ke sistem digital dalam hitungan menit.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {[
              { step: '01', title: 'Klaim Profil', desc: 'Cari bisnis Anda di direktori Go-Play atau buat profil baru secara instan melalui WhatsApp.' },
              { step: '02', title: 'Atur Tarif', desc: 'Input daftar konsol PS4/PS5 dan sesuaikan tarif per jam atau paket sesuai harga Anda.' },
              { step: '03', title: 'Mulai Pantau', desc: 'Jalankan bisnis dengan tenang sementara sistem Go-Play mengelola pencatatan untuk Anda.' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10">
                <div className="w-28 h-28 rounded-full bg-background border-4 border-surface flex items-center justify-center mb-8 relative shadow-xl">
                  <span className="text-4xl font-black text-primary">{item.step}</span>
                  <div className="absolute inset-0 border border-primary/20 rounded-full animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. EXPLANATORY PARAGRAPH ── */}
      <section className="py-20 px-6 bg-gradient-to-b from-surface to-background border-t border-white/5">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-gray-400 text-lg leading-relaxed">
            Di <span className="text-white font-semibold">Go-Play</span>, kami percaya pemilik rental PS layak menikmati
            hasil bisnisnya tanpa stres urusan admin. Kenyataannya, sistem manual sering menyebabkan kebocoran dana yang
            tidak terdeteksi. Kami memahami rasa frustrasi Anda — itulah alasan kami membangun SaaS yang
            mengintegrasikan billing, F&B, dan loyalitas pelanggan dalam satu platform. Dengan Go-Play, Anda bisa
            berhenti mencemaskan kejujuran operasional dan{' '}
            <span className="text-white font-semibold">fokus mengekspansi cabang baru bisnis Anda.</span>
          </p>
        </div>
      </section>

      {/* ── 9. CTA ── */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary/20 to-blue-900/20 border border-primary/30 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Siap Amankan Profit Rental Anda?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Bergabung dengan ratusan pengusaha rental yang telah beralih ke sistem digital Go-Play.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                Request Demo Gratis <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-12 border-t border-white/10 bg-black/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-wider">GO-PLAY</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-8">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> WhatsApp Support
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Instagram className="w-4 h-4" /> Instagram
            </a>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <span className="hover:text-white transition-colors cursor-pointer">Kebijakan Privasi</span>
            <span className="hover:text-white transition-colors cursor-pointer">Syarat & Ketentuan</span>
            <span className="hover:text-white transition-colors cursor-pointer">Tentang Go-Play</span>
          </div>
          <p className="text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} GO-PLAY Indonesia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
