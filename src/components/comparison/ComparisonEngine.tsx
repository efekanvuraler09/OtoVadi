import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Minus, ChevronDown } from 'lucide-react';
import { useVehicleStore } from '../../store/useVehicleStore';
import type { Vehicle } from '../../types/vehicle';
import { LoadingState, StatusScreen, VehicleLoadError } from '../ui/DataState';
import { primaryButtonClass } from '../ui/buttonStyles';
import { SmartImage } from '../ui/SmartImage';
import { cleanText, vehicleName } from '../../utils/vehicleText';

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
  const isLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);
  // Araç kartındaki "Karşılaştır" aksiyonu /karsilastir?a=<slug> ile gelir; yoksa varsayılan seçim
  const [searchParams] = useSearchParams();
  const [leftId, setLeftId] = useState<string>(() => searchParams.get('a') ?? 'hyundai-tucson');
  const [rightId, setRightId] = useState<string>(() => searchParams.get('b') ?? 'volkswagen-tiguan');

  const leftVehicle: Vehicle | undefined = vehicles.find((v) => v.slug === leftId) || vehicles[0];
  // Sağ sütun soldakiyle aynı araca düşmesin
  const rightVehicle: Vehicle | undefined =
    vehicles.find((v) => v.slug === rightId && v.id !== leftVehicle?.id) || vehicles.find((v) => v.id !== leftVehicle?.id);

  // Sayfa doğrudan açıldığında/yenilendiğinde veri henüz gelmemiş olabilir: boş listeyle render etme
  if (isLoading) {
    return <LoadingState label="Karşılaştırma hazırlanıyor..." />;
  }

  if (!leftVehicle || !rightVehicle) {
    if (loadError) {
      return <VehicleLoadError />;
    }
    return (
      <StatusScreen
        eyebrow="Karşılaştırma"
        title="Karşılaştırma için yeterli araç yok"
        description="Karşılaştırma yapabilmek için katalogda en az iki araç bulunmalı."
        actions={
          <Link to="/modeller" className={primaryButtonClass}>
            Modelleri Keşfet
          </Link>
        }
      />
    );
  }

  const renderVehicleSelector = (currentId: string, setVehicle: (id: string) => void) => (
    <div className="relative group flex justify-center mt-8 mb-4 px-2">
      <select
        value={currentId}
        onChange={(e) => setVehicle(e.target.value)}
        aria-label="Karşılaştırılacak aracı seçin"
        className="w-full max-w-full cursor-pointer appearance-none truncate border-b border-transparent bg-transparent py-2 pl-4 pr-8 text-center font-display text-base font-normal text-foreground transition-colors hover:border-border-strong focus:outline-none focus-visible:border-foreground sm:text-xl md:text-2xl"
      >
        {vehicles.map((v) => (
          <option key={v.slug} value={v.slug} className="text-base bg-void text-foreground">
            {vehicleName(v)}
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
        <span className="stat-label mb-3 max-w-full truncate">{label}</span>
        <span
          className={`max-w-full truncate font-sans text-xl font-light tabular-nums transition-colors duration-350 sm:text-2xl md:text-4xl ${isWinner ? 'text-success' : 'text-foreground'}`}
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
          <span className="eyebrow truncate">Öne Çıkan Donanımlar</span>
        </div>
        <div className="flex flex-col gap-6">
          {COMPARE_FEATURES.map((feature) => {
            const hasFeature = vehicle.highlights.includes(feature);
            return (
              <div key={feature} className="flex flex-col items-center gap-2 min-w-0 text-center">
                <span className="max-w-full truncate text-xs font-medium text-foreground sm:text-sm" title={feature}>{feature}</span>
                {hasFeature ? (
                  <Check className="size-5 shrink-0 stroke-[1.5] text-success" aria-label="Var" />
                ) : (
                  <Minus className="size-5 shrink-0 stroke-[1] text-muted" aria-label="Yok" />
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
        
        {/* Studio Image: sabit oran, kırık görselde siluet */}
        <div className="px-2 py-8 sm:px-4 md:py-12">
          <SmartImage
            key={vehicle.id}
            src={vehicle.interactiveGallery?.studioImage || vehicle.media.heroImage}
            alt={vehicleName(vehicle)}
            aspectRatio="16 / 10"
            fit="contain"
            colorHex={vehicle.media.colorHex}
          />
        </div>

        {/* Pricing / Trim */}
        <div className="flex flex-col items-center mb-12">
          <span className="eyebrow" lang="en">{cleanText(vehicle.pricing.trim)}</span>
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
    // overflow-x-clip: yatay taşmayı keser ama (overflow-x-auto'nun aksine) scroll container açmaz,
    // böylece araç seçicilerin sticky davranışı çalışır. min-w-[600px] mobilde yatay kaydırma yaratıyordu.
    <section className="w-full overflow-x-clip bg-void">
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1600px] grid-cols-2 border-t border-border-subtle">
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
