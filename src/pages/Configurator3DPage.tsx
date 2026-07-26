import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, ContactShadows, Html, useProgress } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ChevronLeft, Lightbulb, LightbulbOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CarModel } from '../components/detail/CarModel';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 w-48">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-void/50 backdrop-blur-md">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs font-medium text-foreground drop-shadow-md">
          Model Yükleniyor... {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

const COLORS = [
  { id: 'white', name: 'Beyaz', hex: '#FFFFFF' },
  { id: 'black', name: 'Siyah', hex: '#111111' },
  { id: 'red', name: 'Kırmızı', hex: '#EF4444' },
  { id: 'blue', name: 'Portimao Mavi', hex: '#022B7A' },
];

export function Configurator3DPage() {
  const navigate = useNavigate();
  const [activeColor, setActiveColor] = useState(COLORS[0].hex);
  const [isLightsOn, setIsLightsOn] = useState(false);

  return (
    <div className="relative h-dvh w-full bg-void overflow-hidden">
      {/* Header / Geri Dön Butonu */}
      <div className="absolute left-0 top-0 z-10 w-full p-4 safe-top pointer-events-none">
        <button
          onClick={() => navigate('/')}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-void/50 text-foreground backdrop-blur-md border border-glass-border hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [4, 2, 5], fov: 45 }}
        className="touch-none"
      >
        <color attach="background" args={['#050508']} />
        
        {/* Işıklandırma ve Çevre */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <Environment preset="city" />

        {/* Post-Processing: Gerçekçi Far Parlaması (Bloom) */}
        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={1.2} // Eşiği artırarak sadece gerçekten parlak yüzeyler bloom yapsın
            luminanceSmoothing={0.05} // Sert bir kesim yerine hafif geçiş
            mipmapBlur           // Daha yumuşak, yayılan gerçekçi parlama
            intensity={1.0}      // Daha kontrollü yoğunluk — sis değil, hale efekti
          />
        </EffectComposer>

        {/* Araç Modeli ve Yükleme Ekranı */}
        <Suspense fallback={<Loader />}>
          <CarModel colorHex={activeColor} isLightsOn={isLightsOn} />
          {/* Gerçekçi alt gölge */}
          <ContactShadows resolution={1024} scale={20} blur={2} opacity={0.5} far={10} color="#000000" />
        </Suspense>

        {/* Kontroller */}
        <OrbitControls
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate={!isLightsOn} // Farlar yanarken model sabit kalsın ki incelemek kolay olsun
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Renk ve Far Paneli UI */}
      <div className="absolute bottom-0 left-0 w-full p-6 safe-bottom pointer-events-none">
        <div className="pointer-events-auto glass-panel mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl p-6 relative">
          
          <div className="absolute right-6 top-6">
            <button
              onClick={() => setIsLightsOn(!isLightsOn)}
              className={`flex items-center justify-center h-10 w-10 rounded-full border transition-all ${
                isLightsOn 
                  ? 'bg-accent/20 border-accent text-accent shadow-accent-glow' 
                  : 'bg-void/40 border-glass-border text-muted hover:text-foreground'
              }`}
              title="Farları Aç / Kapat"
            >
              {isLightsOn ? <Lightbulb className="h-5 w-5" /> : <LightbulbOff className="h-5 w-5" />}
            </button>
          </div>

          <p className="text-sm font-medium text-foreground">Gövde Rengi</p>
          <div className="flex gap-4">
            {COLORS.map((color) => {
              const isActive = activeColor === color.hex;
              return (
                <button
                  key={color.id}
                  onClick={() => setActiveColor(color.hex)}
                  title={color.name}
                  className={`h-12 w-12 rounded-full border-2 transition-all ${
                    isActive ? 'border-accent scale-110 shadow-accent-glow' : 'border-transparent scale-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  aria-label={color.name}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
