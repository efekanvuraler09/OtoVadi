import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';

interface TestDriveModalProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

const LOCATIONS = ['İzmir', 'Aydın', 'Denizli', 'Eskişehir', 'Bursa'];
const DATES = ['Bugün', 'Yarın', '2 Gün Sonra'];
const TIMES = ['10:00', '14:00', '16:00'];

type ModalState = 'form' | 'loading' | 'success';

export function TestDriveModal({ vehicle, isOpen, onClose }: TestDriveModalProps) {
  const [modalState, setModalState] = useState<ModalState>('form');
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [selectedDate, setSelectedDate] = useState(DATES[1]);
  const [selectedTime, setSelectedTime] = useState(TIMES[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalState('loading');
    
    setTimeout(() => {
      setModalState('success');
    }, 1500);
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-muted mb-3">Tarih</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {DATES.map(date => (
                          <button
                            key={date}
                            type="button"
                            onClick={() => setSelectedDate(date)}
                            className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 border ${selectedDate === date ? 'border-foreground text-foreground' : 'border-border-subtle text-muted hover:border-muted'}`}
                          >
                            {date}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-muted mb-3">Saat</label>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {TIMES.map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-wider transition-all duration-300 border ${selectedTime === time ? 'border-foreground text-foreground' : 'border-border-subtle text-muted hover:border-muted'}`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
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
