import { motion } from 'framer-motion';
import { Sparkles, Compass, GitCompare } from 'lucide-react';

export function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-void pt-24 pb-20"
    >
      {/* Hero Section */}
      <section className="px-4 md:px-8 lg:px-12 mb-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-widest text-muted mb-4">Hakkımızda</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-foreground leading-tight">
            Geleceğin Sürüş Deneyimini <br className="hidden md:block" /> Yeniden Tanımlıyoruz.
          </h1>
          <p className="mt-6 text-base text-foreground/60 font-light max-w-2xl mx-auto leading-relaxed">
            Klasik otomobil satın alma sürecini, inovatif yapay zeka çözümlerimizle sanata dönüştürüyoruz. Premium segmentin asaletini, dijital çağın hız ve kusursuzluğuyla harmanlıyoruz.
          </p>
        </div>
      </section>

      {/* Vizyon & Misyon */}
      <section className="px-4 md:px-8 lg:px-12 mb-24">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-muted">Vizyonumuz</h2>
            <p className="text-lg md:text-xl font-light tracking-wide text-foreground/80 leading-relaxed">
              Yapay zeka destekli akıllı eşleştirme algoritmalarımızla, kullanıcılarımızın yaşam tarzlarına en uygun premium araçları saniyeler içinde keşfetmelerini sağlıyoruz. Kusursuz bir dijital asistan olarak her adımda yanınızdayız.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-muted">Misyonumuz</h2>
            <p className="text-lg md:text-xl font-light tracking-wide text-foreground/80 leading-relaxed">
              Otomotiv dünyasının geleneksel sınırlarını aşarak; şeffaf, yenilikçi ve tamamen kişiselleştirilmiş bir dijital showroom deneyimi sunmak. Hayalinizdeki araca giden yolu pürüzsüz hale getiriyoruz.
            </p>
          </div>
        </div>
      </section>

      {/* Neden OtoVadi? */}
      <section className="px-4 md:px-8 lg:px-12 border-t border-border-subtle/30 pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-light tracking-wide text-foreground">Neden OtoVadi?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-5">
              <div className="flex size-16 items-center justify-center rounded-full border border-border-subtle bg-foreground/5">
                <Sparkles className="size-6 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm uppercase tracking-[0.15em] text-foreground">Yapay Zeka Destekli Keşif</h3>
              <p className="text-sm font-light text-foreground/60 leading-relaxed max-w-xs">
                Gelişmiş algoritmalarımız, ihtiyaçlarınızı analiz ederek size sadece uygun olan değil, tam aradığınız aracı önerir.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-5">
              <div className="flex size-16 items-center justify-center rounded-full border border-border-subtle bg-foreground/5">
                <Compass className="size-6 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm uppercase tracking-[0.15em] text-foreground">Premium Katalog</h3>
              <p className="text-sm font-light text-foreground/60 leading-relaxed max-w-xs">
                Sadece seçkin ve elit modellerin yer aldığı portföyümüzde, lüks kavramını en ince detayına kadar hissedeceksiniz.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-5">
              <div className="flex size-16 items-center justify-center rounded-full border border-border-subtle bg-foreground/5">
                <GitCompare className="size-6 text-foreground" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm uppercase tracking-[0.15em] text-foreground">Kusursuz Karşılaştırma</h3>
              <p className="text-sm font-light text-foreground/60 leading-relaxed max-w-xs">
                Detaylı ve objektif metriklerle, favori araçlarınızı tüm teknik verileri üzerinden şeffafça karşılaştırabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
