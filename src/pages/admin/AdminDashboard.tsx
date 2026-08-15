import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LogOut, Car, Trash2, Edit2, X, Check, Newspaper, Library } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useVehicleStore } from '../../store/useVehicleStore';
import {
  addVehicleToFirestore,
  updateVehicleInFirestore,
  deleteVehicleFromFirestore,
} from '../../services/vehicleService';
import { subscribeToTestDrives, updateTestDriveStatus, type TestDriveRequest } from '../../services/testDriveService';
import { saveCarOfTheDay, subscribeCarOfTheDay, type CarOfTheDayData } from '../../services/carOfTheDayService';
import {
  subscribeCollections,
  createCollection,
  updateCollection,
  deleteCollection as deleteCollectionFromFirestore,
} from '../../services/collectionService';
import type { Vehicle } from '../../types/vehicle';
import type { VehicleCollection, CollectionEntry } from '../../types/collection';

type AdminView = 'list' | 'add' | 'edit' | 'test-drives' | 'car-of-day' | 'collections';

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

const FloatingSelect = ({ id, label, value, options, onChange, disabled }: any) => (
  <div className={`relative group pt-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
    <select 
      id={id} 
      required 
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors appearance-none disabled:text-muted"
    >
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value} className="bg-void text-foreground">{opt.label}</option>
      ))}
    </select>
    <label 
      htmlFor={id} 
      className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground"
    >
      {label}
    </label>
  </div>
);

// Helper function to generate clean slug from strings
const generateSlug = (brand: string, model: string, year: string) => {
  const text = `${brand} ${model} ${year}`;
  const turkishMap: { [key: string]: string } = {
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };
  
  return text
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, match => turkishMap[match]) // Replace Turkish chars
    .toLowerCase() // Lowercase
    .trim() // Trim whitespace
    .replace(/[^a-z0-9\s-]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove duplicate hyphens
};

const FloatingTextarea = ({ id, label, value, onChange, rows = 3 }: any) => (
  <div className="relative group">
    <textarea 
      id={id} 
      required 
      value={value}
      onChange={onChange}
      rows={rows}
      className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors resize-none" 
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
  
  const [currentView, setCurrentView] = useState<AdminView>('list');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Form States for Add New
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    tagline: '',
    year: '',
    price: '',
    heroImage: '',
    studioImage: '',
    engine: '',
    displacementCc: '',
    hp: '',
    torqueNm: '',
    fuelType: 'petrol',
    zeroTo100: '',
    topSpeedKmh: '',
    transmission: 'automatic',
    drivetrain: 'fwd',
    bodyType: 'sedan',
    segment: 'c',
    trim: '',
    shortDescription: ''
  });

  const [testDrives, setTestDrives] = useState<TestDriveRequest[]>([]);

  // Car of the Day form state
  const [cotdForm, setCotdForm] = useState<CarOfTheDayData>({
    title: '', spotText: '', imageUrl: '', articleText: '',
    engine: '', power: '', torque: '', weight: '',
    acceleration: '', topSpeed: '', conclusion: '', verdictScore: '',
  });

  // Collections state
  const [collections, setCollections] = useState<VehicleCollection[]>([]);
  const [colForm, setColForm] = useState({
    title: '',
    subtitle: '',
    coverImage: '',
    curatorNote: '',
    closingNote: '',
  });
  const [colEntries, setColEntries] = useState<{ vehicleId: string; editorialNote: string }[]>([]);
  const [editingColId, setEditingColId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/admin/login');
      }
    });
    
    const unsubscribeTestDrives = subscribeToTestDrives((data) => {
      setTestDrives(data);
    });

    const unsubscribeCotd = subscribeCarOfTheDay((data) => {
      if (data) {
        setCotdForm(data);
      }
    });

    const unsubscribeCollections = subscribeCollections((cols) => {
      setCollections(cols);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTestDrives();
      unsubscribeCotd();
      unsubscribeCollections();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  // === Add / Update Vehicle ===
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Yalnızca yeni araç eklenirken çalışır (Düzenlemede mevcut id korunur)
    const generatedSlug = generateSlug(formData.brand, formData.model, formData.year || '2024');
    
    const newVehicle: Vehicle = {
      id: editingVehicleId || generatedSlug,
      slug: editingVehicleId 
        ? (vehicles.find(v => v.id === editingVehicleId)?.slug || generatedSlug)
        : generatedSlug,
      brand: formData.brand,
      model: formData.model,
      year: parseInt(formData.year) || 2024,
      segment: (formData.bodyType === 'muscle-car' || formData.bodyType === 'pickup') ? '-' : formData.segment as any,
      bodyType: formData.bodyType as any,
      bodyStyle: formData.bodyType.toUpperCase(),
      tagline: formData.tagline || 'Yeni Eklenen Araç',
      shortDescription: formData.shortDescription || 'Gelişmiş mühendislik ve premium donanımla sunulan ikonik model.',
      pricing: { currency: 'TRY', msrp: parseInt(formData.price) || 0, trim: formData.trim || '' },
      media: { heroImage: formData.heroImage || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2000&auto=format&fit=crop', gallery: [], thumbnail: formData.heroImage || formData.studioImage || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600&auto=format&fit=crop', colorHex: '#000' },
      audio: { idle: { id: '1', label: '', src: '', durationSeconds: 0, format: 'mp3', description: '' }, exhaust: { id: '2', label: '', src: '', durationSeconds: 0, format: 'mp3', description: '' } },
      engine: { 
        code: formData.engine || '1.0', 
        displacementCc: parseInt(formData.displacementCc) || 1000, 
        cylinders: 4, 
        configuration: 'inline', 
        aspiration: 'turbocharged', 
        powerHp: parseInt(formData.hp) || 100, 
        powerKw: Math.round((parseInt(formData.hp) || 100) * 0.7457), 
        torqueNm: parseInt(formData.torqueNm) || 200, 
        fuelType: formData.fuelType as any 
      },
      performance: { 
        zeroTo100Kmh: parseFloat(formData.zeroTo100) || 10.0, 
        topSpeedKmh: parseInt(formData.topSpeedKmh) || 200, 
        transmission: formData.transmission as any, 
        gears: 7, 
        drivetrain: formData.drivetrain as any 
      },
      dimensions: { lengthMm: 4500, widthMm: 1800, heightMm: 1600, wheelbaseMm: 2700, bootCapacityL: 500, curbWeightKg: 1500 },
      multimedia: [],
      interiorMaterials: [],
      technicalSections: [],
      highlights: ['Standart Donanım'],
      featured: false,
      accentColor: 'blue',
      interactiveGallery: { studioImage: formData.studioImage || formData.heroImage, hotspots: [] }
    };

    try {
      if (currentView === 'edit' && editingVehicleId) {
        await updateVehicleInFirestore(editingVehicleId, {
          brand: newVehicle.brand,
          model: newVehicle.model,
          year: newVehicle.year,
          segment: newVehicle.segment,
          bodyType: newVehicle.bodyType,
          bodyStyle: newVehicle.bodyStyle,
          tagline: newVehicle.tagline,
          shortDescription: newVehicle.shortDescription,
          pricing: newVehicle.pricing,
          media: newVehicle.media,
          engine: newVehicle.engine,
          performance: newVehicle.performance,
          interactiveGallery: newVehicle.interactiveGallery,
        });
        setToastMessage('Araç başarıyla güncellendi.');
      } else {
        await addVehicleToFirestore(newVehicle);
        setToastMessage('Araç başarıyla eklendi.');
      }
    } catch (err) {
      console.error('Firestore CRUD hatası:', err);
      setToastMessage('İşlem başarısız oldu. Konsolu kontrol edin.');
    }
    
    // Reset form
    setCurrentView('list');
    setEditingVehicleId(null);
    setFormData({ brand: '', model: '', tagline: '', year: '', price: '', heroImage: '', studioImage: '', engine: '', displacementCc: '', hp: '', torqueNm: '', fuelType: 'petrol', zeroTo100: '', topSpeedKmh: '', transmission: 'automatic', drivetrain: 'fwd', bodyType: 'sedan', segment: 'c', trim: '', shortDescription: '' });

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleEditClick = (v: Vehicle) => {
    setFormData({
      brand: v.brand,
      model: v.model,
      tagline: v.tagline || '',
      year: v.year.toString(),
      price: v.pricing.msrp.toString(),
      heroImage: v.media.heroImage,
      studioImage: v.interactiveGallery?.studioImage || v.media.heroImage,
      engine: v.engine.code,
      displacementCc: v.engine.displacementCc?.toString() || '',
      hp: v.engine.powerHp.toString(),
      torqueNm: v.engine.torqueNm?.toString() || '',
      fuelType: v.engine.fuelType || 'petrol',
      zeroTo100: v.performance.zeroTo100Kmh.toString(),
      topSpeedKmh: v.performance.topSpeedKmh?.toString() || '',
      transmission: v.performance.transmission || 'automatic',
      drivetrain: v.performance.drivetrain || 'fwd',
      bodyType: v.bodyType || 'sedan',
      segment: v.segment === '-' ? 'c' : (v.segment || 'c'),
      trim: v.pricing.trim || '',
      shortDescription: v.shortDescription || ''
    });
    setEditingVehicleId(v.id);
    setCurrentView('edit');
  };

  const handleDeleteClick = async (id: string) => {
    try {
      await deleteVehicleFromFirestore(id);
      setToastMessage('Araç başarıyla silindi.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  const handleTestDriveAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateTestDriveStatus(id, status);
      setToastMessage(`Randevu ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Randevu güncelleme hatası:', err);
    }
  };

  const handleCotdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveCarOfTheDay(cotdForm);
      setToastMessage('Günün Aracı başarıyla güncellendi.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Günün Aracı kaydetme hatası:', err);
      setToastMessage('İşlem başarısız oldu. Konsolu kontrol edin.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // === Collection Handlers ===
  const generateCollectionSlug = (title: string) => {
    const turkishMap: Record<string, string> = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    };
    return title
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, m => turkishMap[m])
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleColSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const entries: CollectionEntry[] = colEntries
        .filter(e => e.vehicleId)
        .map((e, i) => ({ vehicleId: e.vehicleId, editorialNote: e.editorialNote, position: i }));

      if (editingColId) {
        await updateCollection(editingColId, {
          title: colForm.title,
          subtitle: colForm.subtitle,
          coverImage: colForm.coverImage,
          curatorNote: colForm.curatorNote,
          closingNote: colForm.closingNote || undefined,
          entries,
        });
        setToastMessage('Koleksiyon başarıyla güncellendi.');
      } else {
        await createCollection({
          slug: generateCollectionSlug(colForm.title),
          title: colForm.title,
          subtitle: colForm.subtitle,
          coverImage: colForm.coverImage,
          curatorNote: colForm.curatorNote,
          closingNote: colForm.closingNote || undefined,
          entries,
          isPublished: true,
        });
        setToastMessage('Koleksiyon başarıyla oluşturuldu.');
      }

      resetColForm();
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Koleksiyon kaydetme hatası:', err);
      setToastMessage('İşlem başarısız oldu.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleEditColClick = (col: VehicleCollection) => {
    setColForm({
      title: col.title,
      subtitle: col.subtitle,
      coverImage: col.coverImage,
      curatorNote: col.curatorNote,
      closingNote: col.closingNote || '',
    });
    setColEntries(
      col.entries.map(e => ({ vehicleId: e.vehicleId, editorialNote: e.editorialNote }))
    );
    setEditingColId(col.id);
  };

  const resetColForm = () => {
    setColForm({ title: '', subtitle: '', coverImage: '', curatorNote: '', closingNote: '' });
    setColEntries([]);
    setEditingColId(null);
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollectionFromFirestore(id);
      setToastMessage('Koleksiyon silindi.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Koleksiyon silme hatası:', err);
    }
  };

  const addColEntry = () => {
    setColEntries([...colEntries, { vehicleId: '', editorialNote: '' }]);
  };

  const removeColEntry = (index: number) => {
    setColEntries(colEntries.filter((_, i) => i !== index));
  };

  const updateColEntry = (index: number, field: 'vehicleId' | 'editorialNote', value: string) => {
    const updated = [...colEntries];
    updated[index] = { ...updated[index], [field]: value };
    setColEntries(updated);
  };

  return (
    <div className="w-full min-h-screen bg-void flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border-subtle flex flex-col pt-8">
        <div className="px-8 mb-12">
          <Link to="/" className="block cursor-pointer transition-opacity hover:opacity-80 select-none outline-none focus:outline-none">
            <h1 className="font-display text-2xl font-bold tracking-wide text-foreground">OtoVadi</h1>
            <p className="font-sans text-[10px] uppercase tracking-widest text-muted">Admin Panel</p>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setCurrentView('list')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors select-none outline-none focus:outline-none ${currentView === 'list' ? 'bg-surface/50 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Car className="size-4" /> Araçlar
          </button>
          <button 
            onClick={() => {
              setCurrentView('add');
              setEditingVehicleId(null);
              setFormData({ brand: '', model: '', tagline: '', year: '', price: '', heroImage: '', studioImage: '', engine: '', displacementCc: '', hp: '', torqueNm: '', fuelType: 'petrol', zeroTo100: '', topSpeedKmh: '', transmission: 'automatic', drivetrain: 'fwd', bodyType: 'sedan', segment: 'c', trim: '', shortDescription: '' });
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors select-none outline-none focus:outline-none ${currentView === 'add' || currentView === 'edit' ? 'bg-surface/50 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Plus className="size-4" /> Yeni Ekle
          </button>
          <button 
            onClick={() => setCurrentView('test-drives')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors select-none outline-none focus:outline-none ${currentView === 'test-drives' ? 'bg-surface/50 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <div className="relative">
              <span className="block size-4 border-[1.5px] border-current rounded-sm flex items-center justify-center">
                <Check className="size-3" />
              </span>
              {testDrives.filter(t => t.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-void">
                  {testDrives.filter(t => t.status === 'pending').length}
                </span>
              )}
            </div>
            Test Sürüşleri
          </button>
          <button 
            onClick={() => setCurrentView('car-of-day')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors select-none outline-none focus:outline-none ${currentView === 'car-of-day' ? 'bg-surface/50 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Newspaper className="size-4" /> Günün Aracı
          </button>
          <button 
            onClick={() => setCurrentView('collections')}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide transition-colors select-none outline-none focus:outline-none ${currentView === 'collections' ? 'bg-surface/50 text-foreground' : 'text-muted hover:text-foreground'}`}
          >
            <Library className="size-4" /> Koleksiyonlar
          </button>
        </nav>

        <div className="p-4 border-t border-border-subtle space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm tracking-wide text-muted hover:text-red-500 transition-colors select-none outline-none focus:outline-none"
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
                      onClick={() => handleDeleteClick(v.id)}
                      className="p-2 text-muted hover:text-red-500 transition-colors" 
                      aria-label="Sil"
                    >
                      <Trash2 className="size-5 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted mb-4">Envanterde hiç araç bulunmuyor.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TEST DRIVES VIEW */}
        {currentView === 'test-drives' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
            <h2 className="font-display text-4xl font-light text-foreground mb-10">Test Sürüşü Talepleri</h2>
            
            <div className="space-y-4">
              {testDrives.map(td => (
                <div key={td.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border border-border-subtle bg-surface/10 hover:bg-surface/30 transition-colors">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl font-medium text-foreground">{td.customerName}</h3>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border ${
                        td.status === 'pending' ? 'border-yellow-500/50 text-yellow-500' :
                        td.status === 'approved' ? 'border-emerald-500/50 text-emerald-500' :
                        'border-red-500/50 text-red-500'
                      }`}>
                        {td.status === 'pending' ? 'Bekliyor' : td.status === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted uppercase tracking-wider">
                      <span>{td.vehicleName}</span>
                      <span className="text-border-subtle">•</span>
                      <span>{td.date} {td.time}</span>
                      <span className="text-border-subtle">•</span>
                      <span>{td.location}</span>
                      <span className="text-border-subtle">•</span>
                      <span>{td.customerPhone}</span>
                    </div>
                  </div>

                  {td.status === 'pending' && (
                    <div className="flex items-center gap-3 md:border-l md:border-border-subtle md:pl-6">
                      <button
                        onClick={() => handleTestDriveAction(td.id!, 'approved')}
                        className="px-6 py-2 border border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-void transition-colors text-xs uppercase tracking-widest font-medium"
                      >
                        Onayla
                      </button>
                      <button
                        onClick={() => handleTestDriveAction(td.id!, 'rejected')}
                        className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-void transition-colors text-xs uppercase tracking-widest font-medium"
                      >
                        Reddet
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {testDrives.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted mb-4">Henüz test sürüşü talebi bulunmuyor.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CAR OF THE DAY VIEW */}
        {currentView === 'car-of-day' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
            <h2 className="font-display text-4xl font-light text-foreground mb-10">Günün Aracı — Editöryal</h2>

            <form onSubmit={handleCotdSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-8">
                <FloatingInput id="cotd-title" label="Başlık (Örn: Küçük Sporcu)" value={cotdForm.title} onChange={(e: any) => setCotdForm({...cotdForm, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 gap-8">
                <FloatingInput id="cotd-spot" label="Spot Metni" value={cotdForm.spotText} onChange={(e: any) => setCotdForm({...cotdForm, spotText: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 gap-8">
                <FloatingInput id="cotd-image" label="Görsel URL (Dış bağlantı)" value={cotdForm.imageUrl} onChange={(e: any) => setCotdForm({...cotdForm, imageUrl: e.target.value})} />
              </div>

              <div className="mt-8 mb-4 border-b border-border-subtle pb-2">
                <h3 className="font-sans text-xs uppercase tracking-widest text-muted">Teknik Veriler</h3>
              </div>

              <div className="grid grid-cols-3 gap-8">
                <FloatingInput id="cotd-engine" label="Motor Hacmi" value={cotdForm.engine} onChange={(e: any) => setCotdForm({...cotdForm, engine: e.target.value})} />
                <FloatingInput id="cotd-power" label="Güç (HP)" value={cotdForm.power} onChange={(e: any) => setCotdForm({...cotdForm, power: e.target.value})} />
                <FloatingInput id="cotd-torque" label="Maks Tork" value={cotdForm.torque} onChange={(e: any) => setCotdForm({...cotdForm, torque: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-8">
                <FloatingInput id="cotd-weight" label="Ağırlık" value={cotdForm.weight} onChange={(e: any) => setCotdForm({...cotdForm, weight: e.target.value})} />
                <FloatingInput id="cotd-accel" label="0-100 km/s" value={cotdForm.acceleration} onChange={(e: any) => setCotdForm({...cotdForm, acceleration: e.target.value})} />
                <FloatingInput id="cotd-topspeed" label="Maks Hız" value={cotdForm.topSpeed} onChange={(e: any) => setCotdForm({...cotdForm, topSpeed: e.target.value})} />
              </div>

              <div className="mt-8 mb-4 border-b border-border-subtle pb-2">
                <h3 className="font-sans text-xs uppercase tracking-widest text-muted">Makale İçeriği</h3>
              </div>

              <div className="grid grid-cols-1">
                <FloatingTextarea id="cotd-article" label="Makale Metni (Paragrafları boş satır ile ayırın)" value={cotdForm.articleText} onChange={(e: any) => setCotdForm({...cotdForm, articleText: e.target.value})} rows={12} />
              </div>

              <div className="mt-8 mb-4 border-b border-border-subtle pb-2">
                <h3 className="font-sans text-xs uppercase tracking-widest text-muted">Sonuç / Değerlendirme</h3>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <FloatingTextarea id="cotd-conclusion" label="Sonuç Metni" value={cotdForm.conclusion} onChange={(e: any) => setCotdForm({...cotdForm, conclusion: e.target.value})} rows={3} />
              </div>

              <div className="grid grid-cols-1 gap-8">
                <FloatingInput id="cotd-score" label="Puan (Örn: 8.7)" value={cotdForm.verdictScore} onChange={(e: any) => setCotdForm({...cotdForm, verdictScore: e.target.value})} />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setCotdForm({
                    title: '', spotText: '', imageUrl: '', articleText: '',
                    engine: '', power: '', torque: '', weight: '',
                    acceleration: '', topSpeed: '', conclusion: '', verdictScore: ''
                  })}
                  className="w-full sm:w-1/3 py-4 border border-red-500/50 text-red-500 font-sans text-sm font-medium uppercase tracking-widest hover:bg-red-500 hover:text-white transition-colors"
                >
                  Formu Temizle
                </button>
                <button 
                  type="submit"
                  className="w-full sm:flex-1 py-4 bg-foreground text-void font-sans text-sm font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                >
                  Günün Aracını Kaydet
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* COLLECTIONS VIEW */}
        {currentView === 'collections' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-display text-4xl font-light text-foreground">Koleksiyonlar</h2>
            </div>

            {/* Existing Collections */}
            {collections.length > 0 && (
              <div className="mb-14 space-y-4">
                <h3 className="font-sans text-xs uppercase tracking-widest text-muted mb-4">Mevcut Koleksiyonlar</h3>
                {collections.map(c => (
                  <div key={c.id} className="flex items-center gap-6 p-5 border border-border-subtle bg-surface/10 hover:bg-surface/30 transition-colors">
                    {c.coverImage && (
                      <img src={c.coverImage} alt={c.title} className="w-24 h-16 object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-lg text-foreground truncate">{c.title}</h4>
                      <p className="text-xs text-muted mt-1">{c.entries.length} araç · {c.isPublished ? 'Yayında' : 'Taslak'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEditColClick(c)}
                        className="p-2 text-muted hover:text-foreground transition-colors"
                        aria-label="Düzenle"
                      >
                        <Edit2 className="size-5 stroke-[1.5]" />
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(c.id)}
                        className="p-2 text-muted hover:text-red-500 transition-colors"
                        aria-label="Sil"
                      >
                        <Trash2 className="size-5 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collection Form */}
            <div className="border-t border-border-subtle pt-10">
              <h3 className="font-sans text-xs uppercase tracking-widest text-muted mb-8">
                {editingColId ? 'Koleksiyonu Düzenle' : 'Yeni Koleksiyon Oluştur'}
              </h3>

              <form onSubmit={handleColSubmit} className="space-y-8">
                <div className="grid grid-cols-1 gap-8">
                  <FloatingInput id="col-title" label="Koleksiyon Başlığı" value={colForm.title} onChange={(e: any) => setColForm({...colForm, title: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <FloatingInput id="col-subtitle" label="Alt Başlık" value={colForm.subtitle} onChange={(e: any) => setColForm({...colForm, subtitle: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <FloatingInput id="col-cover" label="Kapak Görseli URL" value={colForm.coverImage} onChange={(e: any) => setColForm({...colForm, coverImage: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <FloatingTextarea id="col-curator" label="Küratör Notu" value={colForm.curatorNote} onChange={(e: any) => setColForm({...colForm, curatorNote: e.target.value})} rows={4} />
                </div>
                <div className="grid grid-cols-1 gap-8">
                  <FloatingTextarea id="col-closing" label="Kapanış Notu (Opsiyonel)" value={colForm.closingNote} onChange={(e: any) => setColForm({...colForm, closingNote: e.target.value})} rows={2} />
                </div>

                {/* Vehicle Entries */}
                <div className="mt-8 mb-4 border-b border-border-subtle pb-2">
                  <h3 className="font-sans text-xs uppercase tracking-widest text-muted">Koleksiyon Araçları</h3>
                </div>

                {colEntries.map((entry, i) => (
                  <div key={i} className="border border-border-subtle p-5 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => removeColEntry(i)}
                      className="absolute top-3 right-3 text-muted hover:text-red-500 transition-colors"
                    >
                      <X className="size-4" />
                    </button>

                    <FloatingSelect
                      id={`col-vehicle-${i}`}
                      label={`Araç ${i + 1}`}
                      value={entry.vehicleId}
                      onChange={(e: any) => updateColEntry(i, 'vehicleId', e.target.value)}
                      options={[
                        { label: '— Araç Seçin —', value: '' },
                        ...vehicles.map(v => ({ label: `${v.brand} ${v.model} (${v.year})`, value: v.id }))
                      ]}
                    />

                    <FloatingTextarea
                      id={`col-note-${i}`}
                      label="Editöryal Not"
                      value={entry.editorialNote}
                      onChange={(e: any) => updateColEntry(i, 'editorialNote', e.target.value)}
                      rows={2}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addColEntry}
                  className="w-full py-3 border border-dashed border-border-subtle text-muted hover:text-foreground hover:border-foreground/30 transition-colors text-sm tracking-wide flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" /> Araç Ekle
                </button>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    type="button"
                    onClick={resetColForm}
                    className="w-full sm:w-1/3 py-4 border border-border-subtle text-muted font-sans text-sm font-medium uppercase tracking-widest hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all"
                  >
                    Formu Temizle / İptal
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-4 bg-foreground text-void font-sans text-sm font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                  >
                    {editingColId ? 'Koleksiyonu Güncelle' : 'Koleksiyonu Yayınla'}
                  </button>
                </div>
              </form>
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
              className="relative w-full max-w-2xl bg-surface/90 border border-border-subtle p-10 shadow-2xl z-10 max-h-[90vh] overflow-y-auto pb-24"
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
                
                <div className="grid grid-cols-2 gap-8">
                  <FloatingSelect id="bodyType" label="Kasa Tipi" value={formData.bodyType} onChange={(e: any) => setFormData({...formData, bodyType: e.target.value})} options={[
                    {label: 'Sedan', value: 'sedan'},
                    {label: 'SUV', value: 'suv'},
                    {label: 'Hatchback', value: 'hatchback'},
                    {label: 'Muscle Car', value: 'muscle-car'},
                    {label: 'Pick-up', value: 'pickup'}
                  ]} />
                  <FloatingSelect id="segment" label="Segment" value={formData.segment} onChange={(e: any) => setFormData({...formData, segment: e.target.value})} disabled={formData.bodyType === 'muscle-car' || formData.bodyType === 'pickup'} options={[
                    {label: 'B', value: 'b'},
                    {label: 'C', value: 'c'},
                    {label: 'D', value: 'd'},
                    {label: 'E', value: 'e'},
                    {label: 'F', value: 'f'}
                  ]} />
                </div>

                <div className="grid grid-cols-1">
                  <FloatingInput id="tagline" label="Alt Başlık (Örn: Premium Kompakt Sedan)" value={formData.tagline} onChange={(e: any) => setFormData({...formData, tagline: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-1 pt-4">
                  <FloatingTextarea id="shortDescription" label="Donanım Özeti / Araç Açıklaması" value={formData.shortDescription} onChange={(e: any) => setFormData({...formData, shortDescription: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-3 gap-8">
                  <FloatingInput id="year" label="Üretim Yılı" type="number" value={formData.year} onChange={(e: any) => setFormData({...formData, year: e.target.value})} />
                  <FloatingInput id="trim" label="Paket (Örn: M Sport)" value={formData.trim} onChange={(e: any) => setFormData({...formData, trim: e.target.value})} />
                  <FloatingInput id="price" label="Fiyat (TL)" type="number" value={formData.price} onChange={(e: any) => setFormData({...formData, price: e.target.value})} />
                </div>

                <div className="mt-8 mb-4 border-b border-border-subtle pb-2">
                  <h3 className="font-sans text-xs uppercase tracking-widest text-muted">Teknik Özellikler</h3>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <FloatingInput id="engine" label="Motor Kodu/Tipi" value={formData.engine} onChange={(e: any) => setFormData({...formData, engine: e.target.value})} />
                  <FloatingInput id="displacementCc" label="Motor Hacmi (CC)" type="number" value={formData.displacementCc} onChange={(e: any) => setFormData({...formData, displacementCc: e.target.value})} />
                  <FloatingInput id="hp" label="Beygir (HP)" type="number" value={formData.hp} onChange={(e: any) => setFormData({...formData, hp: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-3 gap-8">
                  <FloatingInput id="torqueNm" label="Tork (Nm)" type="number" value={formData.torqueNm} onChange={(e: any) => setFormData({...formData, torqueNm: e.target.value})} />
                  <FloatingInput id="zero" label="0-100 (sn)" type="number" step="0.1" value={formData.zeroTo100} onChange={(e: any) => setFormData({...formData, zeroTo100: e.target.value})} />
                  <FloatingInput id="topSpeedKmh" label="Maks Hız (Kmh)" type="number" value={formData.topSpeedKmh} onChange={(e: any) => setFormData({...formData, topSpeedKmh: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-3 gap-8">
                  <FloatingSelect id="fuelType" label="Yakıt Tipi" value={formData.fuelType} onChange={(e: any) => setFormData({...formData, fuelType: e.target.value})} options={[
                    {label: 'Benzin (Petrol)', value: 'petrol'},
                    {label: 'Dizel (Diesel)', value: 'diesel'},
                    {label: 'Hibrit (Hybrid)', value: 'hybrid'},
                    {label: 'Plug-in Hibrit', value: 'plug-in-hybrid'},
                    {label: 'Elektrik (Electric)', value: 'electric'}
                  ]} />
                  <FloatingSelect id="transmission" label="Vites Tipi" value={formData.transmission} onChange={(e: any) => setFormData({...formData, transmission: e.target.value})} options={[
                    {label: 'Otomatik (Automatic)', value: 'automatic'},
                    {label: 'CVT', value: 'cvt'},
                    {label: 'Çift Kavrama (DCT)', value: 'dct'},
                    {label: 'Manuel (Manual)', value: 'manual'}
                  ]} />
                  <FloatingSelect id="drivetrain" label="Çekiş Tipi" value={formData.drivetrain} onChange={(e: any) => setFormData({...formData, drivetrain: e.target.value})} options={[
                    {label: 'Önden Çekiş (FWD)', value: 'fwd'},
                    {label: 'Arkadan İtiş (RWD)', value: 'rwd'},
                    {label: 'Dört Çeker (AWD)', value: 'awd'},
                    {label: '4x4 (4WD)', value: '4wd'}
                  ]} />
                </div>

                <div className="mt-8 mb-4 border-b border-border-subtle pb-2">
                  <h3 className="font-sans text-xs uppercase tracking-widest text-muted">Görseller</h3>
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
