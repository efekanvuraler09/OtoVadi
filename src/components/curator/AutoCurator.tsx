import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicleStore } from '../../store/useVehicleStore';
import type { Vehicle } from '../../types/vehicle';
import { GoogleGenerativeAI } from "@google/generative-ai";

type CuratorState = 'prompt' | 'analyzing' | 'result';

const TypewriterText = ({ text, speed = 30 }: { text: string; speed?: number }) => {
  const [charIndex, setCharIndex] = useState(0);

  // Yeni metin geldiğinde sayacı mutlaka sıfırla
  useEffect(() => {
    setCharIndex(0);
  }, [text]);

  // Metni indeks sayısına göre harf harf ilerlet
  useEffect(() => {
    if (!text || charIndex >= text.length) return;

    const timer = setTimeout(() => {
      setCharIndex(prev => prev + 1);
    }, speed); // 30ms lüks hız

    return () => clearTimeout(timer);
  }, [charIndex, text, speed]);

  return <span>{text.substring(0, charIndex)}</span>;
};

export function AutoCurator() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const [currentState, setCurrentState] = useState<CuratorState>('prompt');
  const [inputValue, setInputValue] = useState('');
  const [loadingText, setLoadingText] = useState('OtoVadi verileri analiz ediliyor...');
  const [recommendedVehicle, setRecommendedVehicle] = useState<Vehicle | null>(null);
  const [aiReasoning, setAiReasoning] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("API Key Bulunamadı: VITE_GEMINI_API_KEY eksik veya boş.");
      return;
    }

    setCurrentState('analyzing');
    setLoadingText('OtoVadi verileri yapay zeka ile analiz ediliyor...');

    try {
      const stockInfo = JSON.stringify(vehicles.map(v => ({
        id: v.slug,
        brand: v.brand,
        model: v.model,
        trim: v.pricing.trim,
        price: `${v.pricing.msrp} ${v.pricing.currency}`,
        highlights: v.highlights
      })));

      const aiPrompt = `Sen lüks bir otomotiv danışmanısın. Aşağıda JSON formatında verilen stok listesinden, kullanıcının isteğine en uygun olan 1 aracı seç. İlk satıra SADECE seçtiğin aracın ID'sini yaz. İkinci satırdan itibaren neden bu aracı seçtiğini lüks ve asil bir dille açıkla. Kesinlikle JSON veya Markdown formatı kullanma.\nYanıtını son derece profesyonel, lüks bir dille ve KUSURSUZ bir Türkçe dilbilgisiyle yaz. Asla imla hatası veya kelimelerde harf eksikliği yapma.\n\nKullanıcı İsteği: "${inputValue}"\n\nAraç Listesi: ${stockInfo}`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(aiPrompt);
      const responseText = result.response.text().trim();
      
      const lines = responseText.split('\n');
      const slug = lines[0].trim().replace(/['"]/g, ''); // Temizle
      const reasoning = (lines.slice(1).join('\n').trim() || responseText).trim();

      const match = vehicles.find(v => v.slug === slug) || vehicles[0];
      setRecommendedVehicle(match);
      setAiReasoning(reasoning);
      setCurrentState('result');

    } catch (error) {
      console.error("Gemini SDK Hatası:", error);
      // Fallback
      setRecommendedVehicle(vehicles[0]);
      setAiReasoning("Sistemlerimizde olağanüstü bir yoğunluk var ancak lüks danışmanlarımız sizin için bu özel aracı uygun gördü...");
      setCurrentState('result');
    }
  };

  const resetCurator = () => {
    setInputValue('');
    setRecommendedVehicle(null);
    setCurrentState('prompt');
    setLoadingText('OtoVadi verileri analiz ediliyor...');
  };

  return (
    <section className="relative w-full min-h-[calc(100vh-4rem)] bg-void flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        
        {/* 1. PROMPT STATE */}
        {currentState === 'prompt' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-4xl px-6 flex flex-col items-center"
          >
            <Sparkles className="size-8 text-muted mb-8" strokeWidth={1} />
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground text-center mb-12 tracking-wide">
              Nasıl bir yaşam tarzınız var?
            </h1>
            <form onSubmit={handleSearch} className="w-full relative group">
              <input
                type="text"
                autoFocus
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Örn: Geniş ailem var ve teknolojik bir SUV arıyorum..."
                className="w-full bg-transparent border-b border-border-subtle focus:border-foreground/50 pb-4 text-center font-sans text-lg md:text-xl text-foreground placeholder:text-muted/50 focus:outline-none transition-colors"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute right-0 bottom-4 text-muted hover:text-foreground disabled:opacity-0 transition-all"
              >
                <ArrowRight className="size-6" strokeWidth={1.5} />
              </button>
            </form>
          </motion.div>
        )}

        {/* 2. ANALYZING (LOADING) STATE */}
        {currentState === 'analyzing' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className="relative flex items-center justify-center size-16">
              <div className="absolute inset-0 border border-foreground/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
              <div className="size-2 bg-foreground rounded-full" />
            </div>
            <motion.p
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-display text-xl text-muted tracking-widest uppercase"
            >
              {loadingText}
            </motion.p>
          </motion.div>
        )}

        {/* 3. RESULT STATE */}
        {currentState === 'result' && recommendedVehicle && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-7xl px-4 md:px-8 lg:px-12 flex flex-col items-center"
          >
            {/* Recommendation Reason */}
            <div className="max-w-2xl text-center mb-12">
              <p className="font-sans text-sm uppercase tracking-widest text-emerald-500/80 mb-6">Mükemmel Eşleşme</p>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6 leading-tight">
                {recommendedVehicle.brand} {recommendedVehicle.model}
              </h2>
              <p className="font-sans text-base md:text-lg text-muted leading-relaxed min-h-[80px]">
                "<TypewriterText text={aiReasoning} />"
              </p>
            </div>

            {/* Vehicle Studio Image */}
            <div className="w-full h-64 md:h-96 relative flex justify-center mb-16">
              <img 
                src={recommendedVehicle.interactiveGallery?.studioImage || recommendedVehicle.media.heroImage} 
                alt={`${recommendedVehicle.brand} ${recommendedVehicle.model}`}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-8">
              <Link 
                to={`/arac/${recommendedVehicle.id}`}
                className="px-8 py-4 bg-foreground text-void font-sans text-sm font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors"
              >
                Aracı İncele
              </Link>
              <button 
                onClick={resetCurator}
                className="text-sm font-medium uppercase tracking-widest text-muted hover:text-foreground transition-colors pb-1 border-b border-transparent hover:border-foreground"
              >
                Yeniden Ara
              </button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </section>
  );
}
