import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogOut, Car, Trash2, Edit2, X, Check } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useVehicleStore } from '../../store/useVehicleStore';
import type { Vehicle } from '../../types/vehicle';

type AdminView = 'list' | 'add' | 'edit';

const FloatingInput = ({ id, label, value, type = 'text', onChange, step }: any) => (
  <div className="relative group">
    <input 
      type={type} 
      id={id} 
      required 
      value={value}
      step={step}
      onChange={onChange}
      className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors" 
      placeholder=" " 
    />
    <label 
      htmlFor={id} 
      className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-foreground cursor-text"
    >
      {label}
    </label>
  </div>
);

export function AdminDashboard() {
  const navigate = useNavigate();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const removeVehicle = useVehicleStore((s) => s.removeVehicle);
  const addVehicle = useVehicleStore((s) => s.addVehicle);
  const updateVehicle = useVehicleStore((s) => s.updateVehicle);
  
  const [currentView, setCurrentView] = useState<AdminView>('list');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Form States for Add New
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    price: '',
    heroImage: '',
    studioImage: '',
    engine: '',
    hp: '',
    zeroTo100: '',
    trim: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct a basic dummy vehicle object with the provided data
    const newVehicle: Vehicle = {
      id: `custom-${Date.now()}`,
      slug: `${formData.brand.toLowerCase()}-${formData.model.toLowerCase()}-${Date.now()}`,
      brand: formData.brand,
      model: formData.model,
      year: parseInt(formData.year) || 2024,
      segment: 'c-suv',
      bodyType: 'suv',
      bodyStyle: 'SUV',
      tagline: 'Yeni Eklenen Araç',
      shortDescription: 'Admin paneli üzerinden eklendi.',
      pricing: { currency: 'TRY', msrp: parseInt(formData.price) || 0, trim: formData.trim || '' },
      media: { heroImage: formData.heroImage || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop', gallery: [], thumbnail: formData.heroImage || formData.studioImage || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600&auto=format&fit=crop', colorHex: '#000' },
      audio: { idle: { id: '1', label: '', src: '', durationSeconds: 0, format: 'mp3', description: '' }, exhaust: { id: '2', label: '', src: '', durationSeconds: 0, format: 'mp3', description: '' } },
      engine: { code: formData.engine || '1.0', displacementCc: 1000, cylinders: 4, configuration: 'inline', aspiration: 'turbocharged', powerHp: parseInt(formData.hp) || 100, powerKw: 75, torqueNm: 200, fuelType: 'petrol' },
      performance: { zeroTo100Kmh: parseFloat(formData.zeroTo100) || 10.0, topSpeedKmh: 200, transmission: 'automatic', gears: 7, drivetrain: 'fwd' },
      dimensions: { lengthMm: 4500, widthMm: 1800, heightMm: 1600, wheelbaseMm: 2700, bootCapacityL: 500, curbWeightKg: 1500 },
      multimedia: [],
      interiorMaterials: [],
      technicalSections: [],
      highlights: ['Standart Donanım'],
      featured: false,
      accentColor: 'blue',
      interactiveGallery: { studioImage: formData.studioImage || formData.heroImage, hotspots: [] }
    };

    if (currentView === 'edit' && editingVehicleId) {
      updateVehicle(editingVehicleId, {
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year,
        pricing: newVehicle.pricing,
        media: newVehicle.media,
        engine: newVehicle.engine,
        performance: newVehicle.performance,
        interactiveGallery: newVehicle.interactiveGallery
      });
      setToastMessage('Araç başarıyla güncellendi.');
    } else {
      addVehicle(newVehicle);
      setToastMessage('Araç başarıyla eklendi.');
    }
    
    // Trigger Success
    setCurrentView('list');
    setEditingVehicleId(null);
    setFormData({ brand: '', model: '', year: '', price: '', heroImage: '', studioImage: '', engine: '', hp: '', zeroTo100: '', trim: '' });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const [toastMessage, setToastMessage] = useState('');

  const handleEditClick = (v: Vehicle) => {
    setFormData({
      brand: v.brand,
      model: v.model,
      year: v.year.toString(),
      price: v.pricing.msrp.toString(),
      heroImage: v.media.heroImage,
      studioImage: v.interactiveGallery?.studioImage || v.media.heroImage,
      engine: v.engine.code,
      hp: v.engine.powerHp.toString(),
      zeroTo100: v.performance.zeroTo100Kmh.toString(),
      trim: v.pricing.trim || ''
    });
    setEditingVehicleId(v.id);
    setCurrentView('edit');
  };



  return (
    <div className="w-full min-h-screen bg-void flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-subtle flex flex-col pt-8">
        <div className="px-8 mb-12">
          <h1 className="font-display text-2xl font-bold tracking-wide text-foreground">OtoVadi</h1>
          <p className="font-sans text-[10px] uppercase tracking-widest text-muted">Admin Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setCurrentView('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors ${currentView === 'list' ? 'bg-surface/50 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Car className="size-4" /> Araçlar
          </button>
          <button 
            onClick={() => {
              setCurrentView('add');
              setEditingVehicleId(null);
              setFormData({ brand: '', model: '', year: '', price: '', heroImage: '', studioImage: '', engine: '', hp: '', zeroTo100: '', trim: '' });
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors ${currentView === 'add' || currentView === 'edit' ? 'bg-surface/50 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Plus className="size-4" /> Yeni Ekle
          </button>
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide text-muted hover:text-red-500 transition-colors"
          >
            <LogOut className="size-4" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        
        {/* LIST VIEW */}
        {currentView === 'list' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
            <h2 className="font-display text-4xl font-light text-foreground mb-10">Koleksiyon Envanteri</h2>
            
            <div className="space-y-6">
              {vehicles.map(v => (
                <div key={v.id} className="flex items-center gap-8 p-6 border border-border-subtle bg-surface/10 hover:bg-surface/30 transition-colors">
                  <div className="w-32 h-20 flex-shrink-0 flex items-center justify-center">
                    <img src={v.interactiveGallery?.studioImage || v.media.heroImage} alt={v.model} className="w-full h-full object-contain" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-display text-xl font-medium text-foreground">{v.brand} {v.model}</h3>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-muted uppercase tracking-wider">{v.year}</span>
                      <span className="text-xs text-muted uppercase tracking-wider">{v.pricing.trim}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleEditClick(v)}
                      className="p-2 text-muted hover:text-foreground transition-colors" 
                      aria-label="Düzenle"
                    >
                      <Edit2 className="size-5 stroke-[1.5]" />
                    </button>
                    <button 
                      onClick={() => removeVehicle(v.id)}
                      className="p-2 text-muted hover:text-red-500 transition-colors" 
                      aria-label="Sil"
                    >
                      <Trash2 className="size-5 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <p className="text-muted py-10">Envanterde hiç araç bulunmuyor.</p>
              )}
            </div>
          </motion.div>
        )}

      </main>

      {/* ADD/EDIT MODAL (Floating over everything) */}
      <AnimatePresence>
        {(currentView === 'add' || currentView === 'edit') && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-void/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-surface/80 border border-border-subtle p-10 shadow-2xl z-10"
            >
              <button 
                onClick={() => setCurrentView('list')}
                className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors"
              >
                <X className="size-6 stroke-[1.5]" />
              </button>

              <h2 className="font-display text-3xl font-light text-foreground mb-12">
                {currentView === 'edit' ? 'Aracı Düzenle' : 'Yeni Araç Ekle'}
              </h2>

              <form onSubmit={handleAddSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <FloatingInput id="brand" label="Marka" value={formData.brand} onChange={(e: any) => setFormData({...formData, brand: e.target.value})} />
                  <FloatingInput id="model" label="Model" value={formData.model} onChange={(e: any) => setFormData({...formData, model: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-3 gap-8">
                  <FloatingInput id="year" label="Üretim Yılı" type="number" value={formData.year} onChange={(e: any) => setFormData({...formData, year: e.target.value})} />
                  <FloatingInput id="trim" label="Paket (Örn: M Sport)" value={formData.trim} onChange={(e: any) => setFormData({...formData, trim: e.target.value})} />
                  <FloatingInput id="price" label="Fiyat (TL)" type="number" value={formData.price} onChange={(e: any) => setFormData({...formData, price: e.target.value})} />
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <FloatingInput id="engine" label="Motor Tipi" value={formData.engine} onChange={(e: any) => setFormData({...formData, engine: e.target.value})} />
                  <FloatingInput id="hp" label="Beygir (HP)" type="number" value={formData.hp} onChange={(e: any) => setFormData({...formData, hp: e.target.value})} />
                  <FloatingInput id="zero" label="0-100 (sn)" type="number" step="0.1" value={formData.zeroTo100} onChange={(e: any) => setFormData({...formData, zeroTo100: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <FloatingInput id="heroImage" label="Kapak Görseli URL (Manzaralı/Arka Planlı Geniş Kare)" value={formData.heroImage} onChange={(e: any) => setFormData({...formData, heroImage: e.target.value})} />
                  <FloatingInput id="studioImage" label="Araç Görseli URL (Arka Plansız Şeffaf PNG)" value={formData.studioImage} onChange={(e: any) => setFormData({...formData, studioImage: e.target.value})} />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 mt-8 bg-foreground text-void font-sans text-sm font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                >
                  {currentView === 'edit' ? 'Değişiklikleri Kaydet' : 'Koleksiyona Kaydet'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-[100] bg-void/90 backdrop-blur-md border border-border-subtle px-6 py-4 flex items-center gap-3 shadow-2xl"
          >
            <Check className="size-5 text-emerald-500" />
            <span className="text-foreground font-sans text-sm tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
