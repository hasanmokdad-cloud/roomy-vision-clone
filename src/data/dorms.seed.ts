import { deriveCapacity } from '@/lib/capacity';

export interface SeedRoom {
  id: string;
  roomType: string;
  price: number;
  capacity: number;
  amenities: string[];
  utilities: string;
  nearUniversity?: string;
}

export interface SeedDorm {
  id: string;
  slug: string;
  name: string;
  area: string;
  exteriorPhoto: string;
  verified: boolean;
  // distanceToUniversities: Record<string, string>; // TODO: Re-enable after distance algorithm implementation
  rooms: SeedRoom[];
  minPrice: number;
}

const createRoom = (
  id: string,
  roomType: string,
  price: number,
  amenities: string[],
  utilities: string,
  nearUniversity?: string
): SeedRoom => ({
  id,
  roomType,
  price,
  capacity: deriveCapacity(roomType),
  amenities,
  utilities,
  nearUniversity,
});

export const seedDorms: SeedDorm[] = [
  {
    id: 'dorm-1',
    slug: 'cozy-studio-jbeil',
    name: 'Cozy Studio - Jbeil Center',
    area: 'Jbeil',
    exteriorPhoto: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    verified: true,
    // distanceToUniversities: { 'LAU (Byblos)': '5 min walk', 'USEK': '10 min drive' }, // TODO: Re-enable after distance algorithm implementation
    rooms: [
      createRoom('r1-1', 'Single Studio', 450, ['wifi', 'ac', 'kitchen', 'furnished'], 'All included', 'LAU (Byblos)'),
      createRoom('r1-2', 'Double Room', 300, ['wifi', 'ac', 'laundry'], 'Electricity extra', 'LAU (Byblos)'),
    ],
    minPrice: 300,
  },
  {
    id: 'dorm-2',
    slug: 'modern-apartment-achrafieh',
    name: 'Modern Apartment - Achrafieh',
    area: 'Achrafieh',
    exteriorPhoto: 'https://images.unsplash.com/photo-1502672260066-6bc36a2c563f?w=800',
    verified: true,
    // distanceToUniversities: { 'AUB': '15 min walk', 'LAU (Beirut)': '5 min drive' }, // TODO: Re-enable after distance algorithm implementation
    rooms: [
      createRoom('r2-1', 'Single Room', 550, ['wifi', 'ac', 'gym', 'security', 'furnished'], 'All included', 'AUB'),
      createRoom('r2-2', 'Double Room', 350, ['wifi', 'ac', 'laundry', 'furnished'], 'Water & internet included', 'AUB'),
      createRoom('r2-3', 'Triple Room', 280, ['wifi', 'laundry', 'study'], 'Basic utilities', 'LAU (Beirut)'),
    ],
    minPrice: 280,
  },
  {
    id: 'dorm-3',
    slug: 'luxury-residence-hamra',
    name: 'Luxury Residence - Hamra',
    area: 'Hamra',
    exteriorPhoto: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    verified: true,
    // distanceToUniversities: { 'AUB': '3 min walk', 'Haigazian': '10 min walk' }, // TODO: Re-enable after distance algorithm implementation
    rooms: [
      createRoom('r3-1', 'Premium Single', 700, ['wifi', 'ac', 'gym', 'security', 'furnished', 'balcony'], 'All inclusive', 'AUB'),
      createRoom('r3-2', 'Studio Apartment', 650, ['wifi', 'ac', 'kitchen', 'furnished', 'parking'], 'All inclusive', 'AUB'),
    ],
    minPrice: 650,
  },
  {
    id: 'dorm-4',
    slug: 'budget-friendly-dora',
    name: 'Budget-Friendly Housing - Dora',
    area: 'Dora',
    exteriorPhoto: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    verified: true,
    // distanceToUniversities: { 'Balamand (Dekwaneh)': '5 min drive', 'USJ': '15 min drive' }, // TODO: Re-enable after distance algorithm implementation
    rooms: [
      createRoom('r4-1', 'Shared Room for 2', 250, ['wifi', 'laundry', 'security'], 'Basic utilities', 'Balamand (Dekwaneh)'),
      createRoom('r4-2', 'Triple Room', 200, ['wifi', 'study'], 'Water included', 'Balamand (Dekwaneh)'),
      createRoom('r4-3', 'Quad Room', 180, ['wifi'], 'No utilities', 'USJ'),
    ],
    minPrice: 180,
  },
  {
    id: 'dorm-5',
    slug: 'premium-ashrafieh-heights',
    name: 'Premium Ashrafieh Heights',
    area: 'Ashrafieh',
    exteriorPhoto: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    verified: true,
    // distanceToUniversities: { 'LAU (Beirut)': '8 min drive', 'AUB': '12 min drive' }, // TODO: Re-enable after distance algorithm implementation
    rooms: [
      createRoom('r5-1', 'Deluxe Studio', 800, ['wifi', 'ac', 'gym', 'security', 'furnished', 'balcony', 'parking'], 'All inclusive + maid', 'LAU (Beirut)'),
      createRoom('r5-2', 'Single Room', 600, ['wifi', 'ac', 'gym', 'security', 'furnished'], 'All inclusive', 'LAU (Beirut)'),
    ],
    minPrice: 600,
  },
  {
    id: 'dorm-6',
    slug: 'student-hub-hadat',
    name: 'Student Hub - Hadat',
    area: 'Hadat',
    exteriorPhoto: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    verified: true,
    // distanceToUniversities: { 'LU (Hadat)': '2 min walk', 'BAU': '10 min drive' }, // TODO: Re-enable after distance algorithm implementation
    rooms: [
      createRoom('r6-1', 'Single Room', 350, ['wifi', 'ac', 'study', 'furnished'], 'Basic utilities', 'LU (Hadat)'),
      createRoom('r6-2', 'Double Room', 280, ['wifi', 'laundry', 'study'], 'Water & internet', 'LU (Hadat)'),
      createRoom('r6-3', 'Triple Room', 220, ['wifi', 'study'], 'Internet only', 'BAU'),
    ],
    minPrice: 220,
  },
];
