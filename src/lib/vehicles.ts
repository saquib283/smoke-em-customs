/**
 * Vehicle Catalogue & Brand Directory
 * Provides standardized brands, models, and segment classifications
 * for the Quote Wizard, CRM, and Admin Vehicle Registry.
 */

export interface VehicleModelInfo {
  name: string;
  type: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MUV' | 'LUXURY' | 'TWO_WHEELER';
}

export interface VehicleBrandInfo {
  brand: string;
  isLuxury?: boolean;
  models: VehicleModelInfo[];
}

export const POPULAR_VEHICLE_BRANDS: VehicleBrandInfo[] = [
  {
    brand: 'BMW',
    isLuxury: true,
    models: [
      { name: '3 Series / 330i', type: 'SEDAN' },
      { name: 'M340i xDrive', type: 'LUXURY' },
      { name: '5 Series / 530d', type: 'SEDAN' },
      { name: '7 Series / 740Li', type: 'LUXURY' },
      { name: 'M3 / M4 / M5', type: 'LUXURY' },
      { name: 'X1', type: 'SUV' },
      { name: 'X3', type: 'SUV' },
      { name: 'X5', type: 'SUV' },
      { name: 'X7', type: 'LUXURY' },
      { name: 'Z4', type: 'LUXURY' },
      { name: 'i4 / iX', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Mercedes-Benz',
    isLuxury: true,
    models: [
      { name: 'A-Class Limousine', type: 'SEDAN' },
      { name: 'C-Class (C 200 / C 220d)', type: 'SEDAN' },
      { name: 'E-Class LWB (E 200 / E 220d)', type: 'SEDAN' },
      { name: 'S-Class (S 350d / S 450)', type: 'LUXURY' },
      { name: 'GLA', type: 'SUV' },
      { name: 'GLC', type: 'SUV' },
      { name: 'GLE', type: 'SUV' },
      { name: 'GLS', type: 'LUXURY' },
      { name: 'G-Wagon (G 63 AMG)', type: 'LUXURY' },
      { name: 'AMG GT Coupe', type: 'LUXURY' },
      { name: 'EQE / EQS', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Porsche',
    isLuxury: true,
    models: [
      { name: '911 (Carrera / Turbo / GT3)', type: 'LUXURY' },
      { name: '718 Cayman / Boxster', type: 'LUXURY' },
      { name: 'Macan / Macan GTS', type: 'LUXURY' },
      { name: 'Cayenne / Cayenne Coupe', type: 'LUXURY' },
      { name: 'Panamera', type: 'LUXURY' },
      { name: 'Taycan', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Audi',
    isLuxury: true,
    models: [
      { name: 'A4', type: 'SEDAN' },
      { name: 'A6', type: 'SEDAN' },
      { name: 'A8 L', type: 'LUXURY' },
      { name: 'Q3', type: 'SUV' },
      { name: 'Q5', type: 'SUV' },
      { name: 'Q7', type: 'SUV' },
      { name: 'Q8 / RS Q8', type: 'LUXURY' },
      { name: 'RS5 / e-tron GT', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Land Rover',
    isLuxury: true,
    models: [
      { name: 'Range Rover Vogue / Autobiography', type: 'LUXURY' },
      { name: 'Range Rover Sport', type: 'LUXURY' },
      { name: 'Range Rover Velar', type: 'SUV' },
      { name: 'Range Rover Evoque', type: 'SUV' },
      { name: 'Defender 90 / 110 / 130', type: 'SUV' },
      { name: 'Discovery', type: 'SUV' },
    ],
  },
  {
    brand: 'Jaguar',
    isLuxury: true,
    models: [
      { name: 'F-Pace', type: 'SUV' },
      { name: 'F-Type', type: 'LUXURY' },
      { name: 'XE / XF', type: 'SEDAN' },
    ],
  },
  {
    brand: 'Volvo',
    isLuxury: true,
    models: [
      { name: 'XC40 / XC40 Recharge', type: 'SUV' },
      { name: 'XC60', type: 'SUV' },
      { name: 'XC90', type: 'LUXURY' },
      { name: 'S90', type: 'SEDAN' },
    ],
  },
  {
    brand: 'Lamborghini',
    isLuxury: true,
    models: [
      { name: 'Urus / Urus Performante', type: 'LUXURY' },
      { name: 'Huracán / EVO / STO', type: 'LUXURY' },
      { name: 'Revuelto', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Ferrari',
    isLuxury: true,
    models: [
      { name: '296 GTB / GTS', type: 'LUXURY' },
      { name: 'Roma / Roma Spider', type: 'LUXURY' },
      { name: 'SF90 Stradale', type: 'LUXURY' },
      { name: 'Purosangue', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Rolls-Royce',
    isLuxury: true,
    models: [
      { name: 'Ghost', type: 'LUXURY' },
      { name: 'Phantom', type: 'LUXURY' },
      { name: 'Cullinan', type: 'LUXURY' },
      { name: 'Spectre', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Toyota',
    models: [
      { name: 'Fortuner / Legender', type: 'SUV' },
      { name: 'Innova Crysta', type: 'MUV' },
      { name: 'Innova Hycross', type: 'MUV' },
      { name: 'Camry Hybrid', type: 'SEDAN' },
      { name: 'Hilux', type: 'SUV' },
      { name: 'Vellfire Executive Lounge', type: 'LUXURY' },
      { name: 'Land Cruiser LC300', type: 'LUXURY' },
      { name: 'Urban Cruiser Hyryder', type: 'SUV' },
      { name: 'Glanza', type: 'HATCHBACK' },
    ],
  },
  {
    brand: 'Mahindra',
    models: [
      { name: 'Thar / Thar Earth Edition', type: 'SUV' },
      { name: 'Thar Roxx (5-Door)', type: 'SUV' },
      { name: 'XUV700', type: 'SUV' },
      { name: 'Scorpio-N', type: 'SUV' },
      { name: 'Scorpio Classic', type: 'SUV' },
      { name: 'XUV 3XO', type: 'SUV' },
      { name: 'Bolero Neo', type: 'SUV' },
    ],
  },
  {
    brand: 'Tata',
    models: [
      { name: 'Harrier', type: 'SUV' },
      { name: 'Safari', type: 'SUV' },
      { name: 'Nexon / Nexon EV', type: 'SUV' },
      { name: 'Curvv / Curvv EV', type: 'SUV' },
      { name: 'Altroz', type: 'HATCHBACK' },
      { name: 'Punch / Punch EV', type: 'SUV' },
      { name: 'Tiago / Tigor', type: 'HATCHBACK' },
    ],
  },
  {
    brand: 'Hyundai',
    models: [
      { name: 'Creta / Creta N Line', type: 'SUV' },
      { name: 'Tucson', type: 'SUV' },
      { name: 'Ioniq 5', type: 'LUXURY' },
      { name: 'Verna', type: 'SEDAN' },
      { name: 'Alcazar', type: 'SUV' },
      { name: 'Venue / Venue N Line', type: 'SUV' },
      { name: 'i20 / i20 N Line', type: 'HATCHBACK' },
    ],
  },
  {
    brand: 'Kia',
    models: [
      { name: 'Seltos / X-Line', type: 'SUV' },
      { name: 'Sonet', type: 'SUV' },
      { name: 'Carens', type: 'MUV' },
      { name: 'Carnival Limousine', type: 'LUXURY' },
      { name: 'EV6', type: 'LUXURY' },
    ],
  },
  {
    brand: 'Honda',
    models: [
      { name: 'City / City Hybrid', type: 'SEDAN' },
      { name: 'Elevate', type: 'SUV' },
      { name: 'Amaze', type: 'SEDAN' },
      { name: 'Civic', type: 'SEDAN' },
    ],
  },
  {
    brand: 'Volkswagen',
    models: [
      { name: 'Virtus / GT Plus', type: 'SEDAN' },
      { name: 'Taigun / GT Line', type: 'SUV' },
      { name: 'Tiguan', type: 'SUV' },
      { name: 'Polo / GT TSI', type: 'HATCHBACK' },
    ],
  },
  {
    brand: 'Skoda',
    models: [
      { name: 'Slavia', type: 'SEDAN' },
      { name: 'Kushaq / Monte Carlo', type: 'SUV' },
      { name: 'Kodiaq', type: 'SUV' },
      { name: 'Superb', type: 'LUXURY' },
      { name: 'Octavia / RS', type: 'SEDAN' },
    ],
  },
  {
    brand: 'Superbike / Motorcycle',
    models: [
      { name: 'Ducati Panigale / Streetfighter / Multistrada', type: 'TWO_WHEELER' },
      { name: 'BMW S1000RR / R1250GS / M1000R', type: 'TWO_WHEELER' },
      { name: 'Kawasaki Ninja ZX-10R / H2 / Z900', type: 'TWO_WHEELER' },
      { name: 'Triumph Rocket 3 / Speed Triple / Tiger', type: 'TWO_WHEELER' },
      { name: 'Harley-Davidson Fat Boy / Pan America', type: 'TWO_WHEELER' },
      { name: 'Royal Enfield Interceptor / Continental GT / Himalayan', type: 'TWO_WHEELER' },
    ],
  },
];

export function getBrandList(): string[] {
  return POPULAR_VEHICLE_BRANDS.map((b) => b.brand);
}

export function getModelsForBrand(brandName: string): VehicleModelInfo[] {
  const match = POPULAR_VEHICLE_BRANDS.find(
    (b) => b.brand.toLowerCase() === brandName.toLowerCase().trim()
  );
  return match ? match.models : [];
}

export function detectVehicleType(brand: string, model: string): 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MUV' | 'LUXURY' | 'TWO_WHEELER' {
  const brandMatch = POPULAR_VEHICLE_BRANDS.find(
    (b) => b.brand.toLowerCase() === brand.toLowerCase().trim()
  );
  if (brandMatch) {
    const cleanModel = model.toLowerCase().trim();
    const modelMatch = brandMatch.models.find((m) => {
      const parts = m.name.toLowerCase().split('/').map((p) => p.trim());
      return parts.some((p) => cleanModel.includes(p) || p.includes(cleanModel));
    });
    if (modelMatch) return modelMatch.type;
    if (brandMatch.isLuxury) return 'LUXURY';
  }
  return 'SEDAN';
}
