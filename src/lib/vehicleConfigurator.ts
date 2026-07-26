import type { Vehicle, VehicleConfigurator } from '../types/vehicle';

const DEFAULT_COLORS = (baseHex: string) => [
  { id: 'default', name: 'Standart', hex: baseHex, metallic: true },
  { id: 'white', name: 'Alpin Beyaz', hex: '#f4f4f5', metallic: true },
  { id: 'black', name: 'Siyah Safir', hex: '#18181b', metallic: true },
  { id: 'grey', name: 'Gri Metalik', hex: '#71717a', metallic: true },
  { id: 'blue', name: 'Mavi Metalik', hex: '#1e40af', metallic: true },
  { id: 'red', name: 'Kırmızı', hex: '#b91c1c', metallic: true },
];

const DEFAULT_WHEELS = [
  { id: 'w17', name: '17" Standart', sizeInch: 17 },
  { id: 'w18', name: '18" Sport', sizeInch: 18 },
  { id: 'w19', name: '19" M Sport', sizeInch: 19 },
  { id: 'w20', name: '20" Performans', sizeInch: 20 },
];

/** Araçta configurator yoksa marka rengine göre varsayılan seçenekler üretir */
export function resolveConfigurator(vehicle: Vehicle): VehicleConfigurator {
  if (vehicle.configurator) {
    return vehicle.configurator;
  }

  return {
    colors: DEFAULT_COLORS(vehicle.media.colorHex),
    wheels: DEFAULT_WHEELS,
    defaultColorId: 'default',
    defaultWheelId: 'w18',
    interiorImage: vehicle.media.gallery.find((src) =>
      src.toLowerCase().includes('interior'),
    ),
  };
}
