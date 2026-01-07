export type SpaceType = 
  | 'living_room' 
  | 'bedroom' 
  | 'kitchen' 
  | 'bathroom' 
  | 'balcony' 
  | 'dining' 
  | 'workspace' 
  | 'entrance' 
  | 'exterior' 
  | 'other';

export const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  living_room: 'Living room',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  bathroom: 'Bathroom',
  balcony: 'Balcony',
  dining: 'Dining area',
  workspace: 'Workspace',
  entrance: 'Entrance',
  exterior: 'Exterior',
  other: 'Other',
};

export const SPACE_TYPE_ICONS: Record<SpaceType, string> = {
  living_room: 'Sofa',
  bedroom: 'Bed',
  kitchen: 'ChefHat',
  bathroom: 'Bath',
  balcony: 'Sun',
  dining: 'UtensilsCrossed',
  workspace: 'Monitor',
  entrance: 'DoorOpen',
  exterior: 'Building2',
  other: 'LayoutGrid',
};

export interface ApartmentPhoto {
  id: string;
  apartmentId: string;
  url: string;
  spaceType: SpaceType;
  spaceInstance?: string;
  sortOrder: number;
  caption?: string;
  isCover: boolean;
}

export interface ApartmentSpace {
  id: string;
  apartmentId: string;
  spaceType: SpaceType;
  spaceInstance?: string;
  meta: {
    bedTypes?: string[];
    sleeps?: number;
    amenities?: string[];
    notes?: string;
  };
  sortOrder: number;
}

export interface ApartmentOwner {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  responseRate?: number;
  responseTime?: string;
}

export interface ApartmentBedroom {
  id: string;
  name: string;
  bedType: string;
  baseCapacity: number;
  maxCapacity: number;
  pricingMode: string;
  bedroomPrice?: number;
  bedroomDeposit?: number;
  images: string[];
}

export interface ApartmentDetailData {
  id: string;
  buildingId: string;
  buildingName: string;
  name: string;
  type: string;
  description?: string;
  shortDescription?: string;
  maxCapacity: number;
  guestCapacity?: number;
  bedroomCount: number;
  bathroomCount: number;
  areaM2?: number;
  houseRules?: string[];
  safetyFeatures?: string[];
  cancellationPolicy?: string;
  amenities: string[];
  images: string[];
  videoUrl?: string;
  photos: ApartmentPhoto[];
  spaces: ApartmentSpace[];
  bedrooms: ApartmentBedroom[];
  owner?: ApartmentOwner;
  location?: string;
  address?: string;
  university?: string;
  enableFullApartmentReservation: boolean;
  enableBedroomReservation: boolean;
  enableBedReservation: boolean;
  pricingTiers: {
    capacity: number;
    monthlyPrice: number;
    deposit: number;
  }[];
}

export interface PhotoSection {
  spaceType: SpaceType;
  spaceInstance?: string;
  label: string;
  photos: ApartmentPhoto[];
}
