import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { useAuth } from '../../context/AuthContext';
import { createTestDriveRequest } from '../../services/testDriveService';

interface TestDriveModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

const LOCATIONS = ['İzmir', 'Aydın', 'Denizli', 'Eskişehir', 'Bursa'];

type ModalState = 'form' | 'loading' | 'success';

export function TestDriveModal({ vehicle, isOpen, onClose }: TestDriveModalProps) {
  const [modalState, setModalState] = useState<ModalState>('form');
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState('10:00');
  const [formData, setFormData] = useState({ name: '', surname: '', phone: '' });
  
  const { user, openAuthModal } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onClose();
      openAuthModal();
      return;
    }
    
    setModalState('loading');
    
    try {
      await createTestDriveRequest({
        userId: user.uid,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.brand} ${vehicle.model}`,
        customerName: `${formData.name} ${formData.surname}`,
        customerPhone: formData.phone,
        location: selectedLocation,
        date: selectedDate,
        time: selectedTime,
      });
      setModalState('success');
    } catch (err) {
      console.error(err);
      alert('Randevu oluşturulurken bir hata oluştu.');
      setModalState('form');
    }
  };

  const resetAndClose = () => {
    setTimeout(() => {
      setModalState('form');
    }, 300);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={modalState === 'loading' ? undefined : resetAndClose}
          className="absolute inset-0 bg-void/80 backdrop-blur-lg"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-surface/80 border border-border-subtle p-8 md:p-12 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          {modalState !== 'loading' && modalState !== 'success' && (
            <button
              onClick={resetAndClose}
              className="absolute top-6 right-6 text-muted hover:text-foreground transition-colors"
            >
              <X className="size-6 stroke-[1.5]" />
            </button>
          )}

          <AnimatePresence mode="wait">
            {modalState === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, filter: 'blur(4px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
              >
                <div className="mb-10 text-center">
                  <h2 className="font-display text-3xl font-light text-foreground mb-2">Test Sürüşü</h2>
                  <p className="font-sans text-xs uppercase tracking-widest text-muted">{vehicle.brand} {vehicle.model}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 flex flex-col">
                  
                  {/* Floating Label Inputs */}
                  <div className="space-y-6">
                    <div className="relative group">
                      <input 
                        type="text" 
                        id="td-name" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors" 
                        placeholder=" " 
                      />
                      <label 
                        htmlFor="td-name" 
                        className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-foreground cursor-text"
                      >
                        Adınız
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        type="text" 
                        id="td-surname" 
                        required 
                        value={formData.surname}
                        onChange={(e) => setFormData({...formData, surname: e.target.value})}
                        className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors" 
                        placeholder=" " 
                      />
                      <label 
                        htmlFor="td-surname" 
                        className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-foreground cursor-text"
                      >
                        Soyadınız
                      </label>
                    </div>

                    <div className="relative group">
                      <input 
                        type="tel" 
                        id="td-phone" 
                        required 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="peer w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors" 
                        placeholder=" " 
                      />
                      <label 
                        htmlFor="td-phone" 
                        className="absolute left-0 -top-4 text-[10px] uppercase tracking-widest text-foreground transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-muted peer-focus:-top-4 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-foreground cursor-text"
                      >
                        Telefon Numaranız
                      </label>
                    </div>
                  </div>

                  {/* Location Dropdown */}
                  <div className="relative">
                    <label className="block text-xs uppercase tracking-widest text-muted mb-2">Showroom</label>
                    <select 
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors appearance-none cursor-pointer"
                    >
                      {LOCATIONS.map(loc => (
                        <option key={loc} value={loc} className="bg-void text-foreground">{loc} OtoVadi Center</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Select: Dates & Times */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-muted mb-2">Tarih</label>
                      <input 
                        type="date"
                        min={todayStr}
                        required
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-muted mb-2">Saat</label>
                      <input 
                        type="time"
                        required
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full bg-transparent border-b border-border-subtle focus:border-foreground py-2 text-foreground font-sans outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit"
                    className="w-full py-4 mt-4 bg-foreground text-void font-sans text-sm font-medium uppercase tracking-widest hover:bg-foreground/90 transition-colors"
                  >
                    Randevu Oluştur
                  </button>

                </form>
              </motion.div>
            )}

            {modalState === 'loading' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="relative flex items-center justify-center size-16 mb-6">
                  <div className="absolute inset-0 border border-foreground/30 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
                  <div className="size-2 bg-foreground rounded-full" />
                </div>
                <p className="font-sans text-xs uppercase tracking-widest text-muted">
                  Talebiniz işleniyor...
                </p>
              </motion.div>
            )}

            {modalState === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="size-16 rounded-full border border-emerald-500/30 flex items-center justify-center mb-8 bg-emerald-500/10">
                  <Check className="size-8 text-emerald-500 stroke-[1.5]" />
                </div>
                <h3 className="font-display text-2xl font-light text-foreground mb-4">Randevunuz Onaylandı</h3>
                <p className="text-muted text-sm leading-relaxed mb-10 px-4">
                  {selectedDate} saat {selectedTime} için {selectedLocation} OtoVadi Center'da test sürüşü talebiniz başarıyla alındı. Temsilcilerimiz kısa süre içinde sizinle iletişime geçecektir.
                </p>
                <button
                  onClick={resetAndClose}
                  className="px-8 py-3 border border-border-subtle text-muted hover:border-foreground hover:text-foreground uppercase tracking-widest text-xs transition-colors"
                >
                  Kapat
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
