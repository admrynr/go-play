import Link from 'next/link';
import Image from 'next/image';
import {
  TrendingUp, ChevronRight,
  CheckCircle2, AlertTriangle, DollarSign,
  Smartphone, Trophy, Zap, Users,
  MessageCircle, Instagram, Globe, Play, QrCode
} from 'lucide-react';
import FeaturesSection from './components/FeaturesSection';

const WA_LINK = "https://wa.me/6289688578285?text=halo%20saya%20ingin%20request%20demo%20TimeStation";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden font-sans">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="TimeStation Logo" width={160} height={40} className="object-contain w-28 sm:w-40" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="px-4 sm:px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              Login
            </Link>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 sm:px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(0,55,145,0.5)] transition-all text-xs sm:text-sm whitespace-nowrap"
            >
              Request Demo
            </a>
          </div>
        </div>
      </nav>

      {/* â”€â”€ 1. HERO â”€â”€ */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/20 blur-[130px] rounded-full opacity-40 pointer-events-none" />

        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Super Billing App #1 untuk Rental PS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Bukan Sekadar Billing.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Semua yang Anda Butuhkan Untuk Ekosistem Rental Digital.
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Tinggalkan sistem manual yang rawan bocor. TimeStation hadir sebagai Super Billing App:
            Landing Page kustom, Booking Online real-time, integrasi Menu F&amp;B, hingga sistem
            Loyalitas Otomatis dalam satu dasbor.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,55,145,0.4)] flex items-center justify-center gap-2"
            >
              Bangun Ekosistem Bisnis Anda <ChevronRight className="w-5 h-5" />
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

      {/* â”€â”€ 2. SOCIAL PROOF â”€â”€ */}
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

      {/* â”€â”€ 3. STAKES (The Pain) â”€â”€ */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="section-label text-sm font-bold tracking-widest uppercase">Masalah</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">
              Kalah Bersaing karena Masih<br />Mengandalkan Manajemen Manual?
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-blue-400 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Globe,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                title: 'Zero Digital Presence',
                desc: 'Tanpa Landing Page, calon pelanggan tidak bisa mengecek ketersediaan unit dari rumah â€” mereka pergi ke kompetitor.'
              },
              {
                icon: DollarSign,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10',
                title: 'Revenue Leakage',
                desc: 'Kehilangan potensi pendapatan dari F&B yang sering lupa tercatat dalam sistem billing manual.'
              },
              {
                icon: Users,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10',
                title: 'Low Customer Retention',
                desc: 'Sulit membuat pelanggan kembali karena tidak adanya sistem poin loyalitas yang mengikat secara otomatis.'
              },
              {
                icon: AlertTriangle,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                title: 'Operational Friction',
                desc: 'Pelanggan harus bolak-balik ke kasir hanya untuk memesan minum atau meminta tambah waktu bermain.'
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

      {/* â”€â”€ 4. VALUE PROPOSITION â”€â”€ */}
      <section className="py-20 px-6 bg-surface border-y border-white/5">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <span className="section-label text-sm font-bold tracking-widest uppercase">Solusi</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3">Satu Platform, Banyak Dampak Nyata</h2>
            <div className="w-20 mt-4 mb-2 h-1 bg-gradient-to-r from-primary to-blue-400 mx-auto rounded-full" />
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              {
                icon: Smartphone,
                color: 'text-blue-400',
                bg: 'bg-blue-500/10 border-blue-500/20',
                title: 'Dynamic Landing Page',
                desc: 'Tenant mendapatkan halaman publik profesional dengan Live Preview status unit (Idle/Active) yang bisa diedit via Page Builder.'
              },
              {
                icon: Globe,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10 border-cyan-500/20',
                title: 'Online Booking',
                desc: 'Perluas pangsa pasar dengan menerima reservasi dari customer online langsung melalui Landing Page tenant, tanpa perlu telepon atau chat manual.'
              },
              {
                icon: QrCode,
                color: 'text-orange-400',
                bg: 'bg-orange-500/10 border-orange-500/20',
                title: 'Integrated QR Ecosystem',
                desc: 'Pemain bisa memesan makanan, panggil operator, atau request tambah waktu cukup dengan scan QR di tempat duduk.'
              },
              {
                icon: Trophy,
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
                title: 'Automated Loyalty Engine',
                desc: 'Tingkatkan repeat order dengan sistem poin otomatis (Main X jam gratis 1 jam) yang bisa dikustomisasi penuh oleh tenant.'
              },
              {
                icon: TrendingUp,
                color: 'text-green-400',
                bg: 'bg-green-500/10 border-green-500/20',
                title: 'Advanced Billing',
                desc: 'Billing terintegrasi penuh dengan order F&B, poin loyalitas, dan diskon â€” dilengkapi live report yang akurat dan dapat diandalkan kapan saja.'
              },
            ].map((item, i) => (
              <div key={i} className={`w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] p-8 border rounded-2xl ${item.bg} text-center flex-shrink-0`}>
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

      {/* â”€â”€ 5. GUIDE (Empathy & Authority) â”€â”€ */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <CheckCircle2 className="w-4 h-4 text-[#6B9FFF]" style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 14px rgba(107,159,255,0.5))' }} />
            <span className="section-label text-sm font-semibold">Platform Terpercaya</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Di Tengah Persaingan Ketat,<br />Spek Besar Saja Tidak Cukup.
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Kami memahami bahwa memberikan TV besar saja tidak lagi membedakan Anda dari kompetitor.
            Anda butuh sistem yang membuat pelanggan merasa dimanjakan.
            <span className="text-white font-semibold"> TimeStation adalah platform Super Billing pertama</span> yang
            didesain khusus untuk mendigitalisasi seluruh aspek operasional Rental PS demi
            mengamankan profit dan kenyamanan pelanggan.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
            {['Super Billing App', 'Custom Landing Page', 'QR Ecosystem', 'Loyalty Otomatis'].map((badge, i) => (
              <span key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ 6. FEATURES DEEP-DIVE â”€â”€ */}
      <FeaturesSection />

      {/* â”€â”€ 7. THE PLAN â”€â”€ */}
      <section className="py-28 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="section-label text-sm font-bold tracking-widest uppercase">Cara Mulai</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3">3 Langkah Mudah</h2>
            <div className="w-20 mt-4 mb-2 h-1 bg-gradient-to-r from-primary to-blue-400 mx-auto rounded-full" />
            <p className="text-gray-400 mt-4">Dari nol ke ekosistem digital dalam hitungan menit.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-14 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            {[
              {
                step: '01',
                title: 'Klaim & Bangun Page',
                desc: 'Cari bisnis Anda di direktori atau buat profil baru dan kustomisasi tampilan Landing Page Anda.'
              },
              {
                step: '02',
                title: 'Atur Tarif & Menu',
                desc: 'Input daftar konsol, harga sewa, katalog F&B, dan tentukan aturan poin loyalitas Anda.'
              },
              {
                step: '03',
                title: 'Cetak QR & Pantau',
                desc: 'Letakkan QR Code di setiap stasiun dan biarkan TimeStation mengelola pencatatan serta kenyamanan pelanggan.'
              },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center relative z-10">
                <div className="w-28 h-28 rounded-full bg-background border-4 border-surface flex items-center justify-center mb-8 relative shadow-xl">
                  <span className="text-4xl font-black text-primary">{item.step}</span>
                  <div className="absolute inset-0 border border-primary/20 rounded-full animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{item.desc}</p>

                {/* Video Thumbnail Placeholder */}
                <div className="w-full aspect-video bg-surface border border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer group hover:border-primary/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Play className="w-5 h-5 text-primary ml-0.5" />
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Video Tutorial</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ 8. EXPLANATORY PARAGRAPH â”€â”€ */}
      <section className="py-20 px-6 bg-gradient-to-b from-surface to-background border-t border-white/5">
        <div className="container mx-auto max-w-3xl text-center">
          <p className="text-gray-400 text-lg leading-relaxed">
            Di <span className="text-white font-semibold">TimeStation</span>, kami percaya pemilik rental PS
            layak memiliki brand yang kuat dan operasional yang modern. Kenyataannya, sistem manual dan
            billing konvensional seringkali menyebabkan kebocoran dana dan hilangnya loyalitas pelanggan.
            Kami memahami tantangan Anda â€” itulah alasan kami membangun Super Billing App yang
            mengintegrasikan timer akurat dengan fitur pemasaran digital. Dengan TimeStation, Anda bisa
            berhenti mencemaskan kejujuran operasional dan{' '}
            <span className="text-white font-semibold">mulai fokus mengekspansi cabang baru bisnis Anda.</span>
          </p>
        </div>
      </section>

      {/* â”€â”€ 9. CTA â”€â”€ */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary/20 to-blue-900/20 border border-primary/30 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Siap Bangun Ekosistem Rental Anda?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Bergabung dengan ratusan pengusaha rental yang telah beralih ke sistem digital TimeStation.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                Bangun Ekosistem Bisnis Anda <ChevronRight className="w-5 h-5" />
              </a>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* â”€â”€ FOOTER â”€â”€ */}
      <footer className="py-12 border-t border-white/10 bg-black/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center mb-6">
            <Image src="/logo.svg" alt="TimeStation Logo" width={160} height={40} className="object-contain" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-8">
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" /> WhatsApp Support
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Instagram className="w-4 h-4" /> Instagram
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> TikTok
            </a>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <span className="hover:text-white transition-colors cursor-pointer">Kebijakan Privasi</span>
            <span className="hover:text-white transition-colors cursor-pointer">Syarat &amp; Ketentuan</span>
            <span className="hover:text-white transition-colors cursor-pointer">Tentang TimeStation</span>
          </div>
          <p className="text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} TimeStation Indonesia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
