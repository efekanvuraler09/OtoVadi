import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Minus, ChevronDown } from 'lucide-react';
import { useVehicleStore } from '../../store/useVehicleStore';
import type { Vehicle } from '../../types/vehicle';

const COMPARE_FEATURES = [
  'Cam Tavan',
  'Matrix LED Far',
  'Şerit Takip Sistemi',
  'Koltuk Isıtma',
  'Kör Nokta Uyarısı',
  'Adaptif Hız Sabitleyici',
  '4WD Çekiş'
];

export function ComparisonEngine() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  // Default selection
  const [leftId, setLeftId] = useState<string>('hyundai-tucson');
  const [rightId, setRightId] = useState<string>('volkswagen-tiguan');

  const leftVehicle = vehicles.find((v) => v.slug === leftId) || vehicles[0];
  const rightVehicle = vehicles.find((v) => v.slug === rightId) || vehicles[1];

  const renderVehicleSelector = (currentId: string, setVehicle: (id: string) => void) => (
    <div className="relative group flex justify-center mt-8 mb-4">
      <select 
        value={currentId} 
        onChange={(e) => setVehicle(e.target.value)}
        className="appearance-none bg-transparent font-display text-xl md:text-2xl font-light text-foreground text-center cursor-pointer focus:outline-none pr-8 pl-4 py-2 border-b border-transparent hover:border-border-subtle transition-colors"
      >
        {vehicles.map((v) => (
          <option key={v.slug} value={v.slug} className="text-base bg-void text-foreground">
            {v.brand} {v.model}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
        <ChevronDown className="size-5" />
      </div>
    </div>
  );

  const parseNumber = (val: string | number): number => {
    if (typeof val === 'number') return val;
    const match = val.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : NaN;
  };

  const renderStat = (
    label: string, 
    myValue: string | number, 
    opponentValue?: string | number, 
    type: 'higher' | 'lower' | 'neutral' = 'neutral'
  ) => {
    let isWinner = false;
    
    if (type !== 'neutral' && opponentValue !== undefined) {
      const myNum = parseNumber(myValue);
      const oppNum = parseNumber(opponentValue);
      
      if (myNum !== oppNum && !Number.isNaN(myNum) && !Number.isNaN(oppNum)) {
        if (type === 'higher') {
          isWinner = myNum > oppNum;
        } else {
          isWinner = myNum < oppNum;
        }
      }
    }

    return (
      <div className="flex flex-col items-center py-6 min-w-0 px-2 text-center">
        <span className="text-[10px] uppercase tracking-widest text-muted mb-3 truncate max-w-full">{label}</span>
        <span 
          className={`font-display text-2xl sm:text-3xl md:text-5xl font-light break-words max-w-full truncate transition-colors duration-500 ${isWinner ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`} 
          title={String(myValue)}
        >
          {myValue}
        </span>
      </div>
    );
  };

  const renderFeatureRow = (vehicle: Vehicle) => {
    return (
      <div className="flex flex-col w-full px-2 sm:px-4 md:px-12 mt-12 gap-8 min-w-0">
        <div className="flex justify-center border-b border-border-subtle pb-4">
          <span className="text-xs uppercase tracking-widest text-muted truncate">Öne Çıkan Donanımlar</span>
        </div>
        <div className="flex flex-col gap-6">
          {COMPARE_FEATURES.map((feature) => {
            const hasFeature = vehicle.highlights.includes(feature);
            return (
              <div key={feature} className="flex flex-col items-center gap-2 min-w-0 text-center">
                <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-full" title={feature}>{feature}</span>
                {hasFeature ? (
                  <Check className="size-5 text-emerald-500 stroke-[1.5] shrink-0" />
                ) : (
                  <Minus className="size-5 text-muted/30 stroke-[1] shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderColumn = (vehicle: Vehicle, setVehicle: (id: string) => void, otherVehicle: Vehicle) => {
    return (
      <div className="flex flex-col w-full pb-20">
        <div className="sticky top-16 z-20 bg-void/90 backdrop-blur-md pb-4">
          {renderVehicleSelector(vehicle.slug, setVehicle)}
        </div>
        
        {/* Studio Image */}
        <div className="w-full flex justify-center py-12 px-4 h-64 md:h-80 lg:h-96 object-contain">
          <motion.img 
            key={vehicle.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            src={vehicle.interactiveGallery?.studioImage || vehicle.media.heroImage} 
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Pricing / Trim */}
        <div className="flex flex-col items-center mb-12">
          <span className="text-xs uppercase tracking-widest text-muted">{vehicle.pricing.trim}</span>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-4">
          {renderStat('Motor', vehicle.engine.code, otherVehicle.engine.code, 'neutral')}
          {renderStat('Güç', `${vehicle.engine.powerHp} HP`, `${otherVehicle.engine.powerHp} HP`, 'higher')}
          {renderStat('Tork', `${vehicle.engine.torqueNm} Nm`, `${otherVehicle.engine.torqueNm} Nm`, 'higher')}
          {renderStat('Maks. Hız', `${vehicle.performance.topSpeedKmh} km/s`, `${otherVehicle.performance.topSpeedKmh} km/s`, 'higher')}
          {renderStat('0-100 km/s', `${vehicle.performance.zeroTo100Kmh} sn`, `${otherVehicle.performance.zeroTo100Kmh} sn`, 'lower')}
          {renderStat('Ağırlık', `${vehicle.dimensions.curbWeightKg} kg`, `${otherVehicle.dimensions.curbWeightKg} kg`, 'lower')}
          {renderStat('Bagaj', `${vehicle.dimensions.bootCapacityL} L`, `${otherVehicle.dimensions.bootCapacityL} L`, 'higher')}
        </div>

        {/* Features */}
        {renderFeatureRow(vehicle)}
      </div>
    );
  };

  return (
    <section className="w-full min-h-screen bg-void pt-16 overflow-x-auto">
      <div className="mx-auto min-w-[600px] max-w-[1600px] grid grid-cols-2 min-h-screen border-t border-border-subtle relative">
        {/* Left Column */}
        <div className="border-r border-border-subtle min-w-0">
          {renderColumn(leftVehicle, setLeftId, rightVehicle)}
        </div>
        
        {/* Right Column */}
        <div className="min-w-0">
          {renderColumn(rightVehicle, setRightId, leftVehicle)}
        </div>
      </div>
    </section>
  );
}
