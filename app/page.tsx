import Link from 'next/link';
import { Gamepad2, Monitor, QrCode, TrendingUp, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden font-sans">
      {/* Navbar */}
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
              className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/login" // Ideally /register, but using login for now
              className="px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-[0_0_20px_rgba(0,55,145,0.5)] transition-all"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none" />

        <div className="container mx-auto text-center relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">Platform No. #1 untuk Pengusaha Rental PS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-fade-in-up delay-100">
            Kelola Rental PS Anda <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
              Secara Otomatis
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Tinggalkan cara catat manual. Gunakan GO-PLAY untuk manajemen billing, order makanan via QR, dan laporan keuangan dalam satu aplikasi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,55,145,0.4)] flex items-center justify-center gap-2"
            >
              Mulai Sekarang Gratis
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 transition-all flex items-center justify-center"
            >
              Pelajari Fitur
            </Link>
          </div>
        </div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Rental Terdaftar', value: '500+' },
              { label: 'Transaksi Harian', value: '10k+' },
              { label: 'Uptime Server', value: '99.9%' },
              { label: 'Support', value: '24/7' },
            ].map((stat, i) => (
              <div key={i}>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-gray-500 text-sm uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">Fitur Lengkap untuk Bisnis Anda</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola operasional rental, dari billing hingga dapur.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Monitor className="w-10 h-10 text-blue-400" />}
              title="Smart Billing Dashboard"
              desc="Pantau durasi main tiap TV secara real-time. Setup tarif per jam atau paket loose dengan mudah."
            />
            <FeatureCard
              icon={<QrCode className="w-10 h-10 text-primary" />}
              title="QR Code Ordering"
              desc="Pelanggan scan QR di meja untuk pesan makanan/minuman tanpa teriak panggil operator."
            />
            <FeatureCard
              icon={<TrendingUp className="w-10 h-10 text-green-400" />}
              title="Laporan Keuangan"
              desc="Otomatis rekap omzet harian, mingguan, dan bulanan. Pantau performa bisnis dari mana saja."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary/20 to-blue-900/20 border border-primary/30 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">Siap Mengembangkan Usaha Rental Anda?</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Bergabung dengan ratusan pengusaha rental lainnya yang telah beralih ke sistem digital.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-gray-100 transition-all hover:scale-105"
              >
                Daftar GO-PLAY Sekarang
              </Link>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/30 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-black/50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-wider">GO-PLAY</span>
          </div>
          <div className="text-gray-500 text-sm">
            &copy; 2026 GO-PLAY Indonesia. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-surface border border-white/10 p-8 rounded-2xl hover:border-primary/50 transition-colors group">
      <div className="bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
