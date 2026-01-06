import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Wifi, Car, Snowflake, Dumbbell, ShieldCheck, UtensilsCrossed, BookOpen, Trees, Users, Zap, Droplets, ArrowUpDown, Sofa, PawPrint, Brush, Waves, Flower2, DoorOpen, X, Tv, Thermometer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface Filters {
  priceRange: [number, number];
  universities: string[];
  areas: string[];
  roomTypes: string[];
  capacity?: number;
  cities: string[];
  shuttle: 'all' | 'available' | 'none';
  genderPreference: string[];
  amenities: string[];
  electricity24_7?: boolean;
  wifiIncluded?: boolean;
  hasWashingMachine?: boolean;
  hasDryingMachine?: boolean;
}

interface Room {
  id: string;
  dorm_id: string;
  name?: string;
  type?: string;
  price?: number;
  capacity?: number;
  available?: boolean;
}

interface AirbnbFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  dorms: any[];
  rooms: Room[]; // For accurate room-level filtering
}

// Data
const byblosAreas = [
  'Blat', 'Nahr Ibrahim', 'Halat', 'Jeddayel', 'Mastita', 'Fidar', 'Habboub'
];

const beirutAreas = [
  'Hamra', 'Manara', 'Ain El Mraisseh', 'Raoucheh', 'Ras Beirut', 'UNESCO',
  'Geitawi', 'Dora', 'Badaro', 'Ashrafieh', 'Verdun', 'Sin El Fil', 'Dekwaneh',
  'Jdeideh', 'Mar Elias', 'Borj Hammoud', 'Hazmieh', 'Furn El Chebbak',
  'Tayouneh', 'Jnah', "Ras Al Naba'a", 'Gemmayze', 'Clemenceau', 'Khalde'
];

const byblosUniversities = ['LAU Byblos'];
const beirutUniversities = ['LAU Beirut', 'AUB', 'NDU', 'USJ', 'BAU', 'LU Hadat', 'Balamand Dekwaneh', 'Balamand ALBA', 'Haigazian', 'USEK'];

import { studentRoomTypes, matchesRoomTypeFilter } from '@/data/roomTypes';

// Student room types without "Any" for filter checkboxes
const studentRoomTypesForFilters = studentRoomTypes.filter(t => t !== 'Any');

const budgetPresets = [
  { label: '<$300', min: 0, max: 300 },
  { label: '$300-$500', min: 300, max: 500 },
  { label: '$500-$800', min: 500, max: 800 },
  { label: '>$800', min: 800, max: 2000 }
];

const capacityOptions = [1, 2, 3, 4, 5, 6];

import { WashingMachine } from 'lucide-react';

// Amenity categories with icons - aligned with wizard config
const amenityCategories = {
  'Popular': [
    { name: 'WiFi', icon: Wifi },
    { name: 'Parking', icon: Car },
    { name: 'Air Conditioning', icon: Snowflake },
  ],
  'Essentials': [
    { name: 'Laundry', icon: WashingMachine },
    { name: 'Kitchen', icon: UtensilsCrossed },
    { name: 'Furnished', icon: Sofa },
    { name: 'Heating', icon: Thermometer },
    { name: 'TV', icon: Tv },
    { name: 'Electricity', icon: Zap },
    { name: 'Water', icon: Droplets },
  ],
  'Facilities': [
    { name: 'Gym', icon: Dumbbell },
    { name: 'Study Room', icon: BookOpen },
    { name: 'Common Area', icon: Users },
    { name: 'Elevator', icon: ArrowUpDown },
  ],
  'Safety & Services': [
    { name: 'Security', icon: ShieldCheck },
    { name: 'Cleaning Service', icon: Brush },
    { name: 'Pet Friendly', icon: PawPrint },
  ],
  'Outdoor': [
    { name: 'Pool', icon: Waves },
    { name: 'Garden', icon: Flower2 },
    { name: 'Balcony', icon: DoorOpen },
  ],
};

const popularAmenities = amenityCategories['Popular'];

export function AirbnbFiltersModal({
  open,
  onOpenChange,
  filters,
  onFilterChange,
  dorms,
  rooms
}: AirbnbFiltersModalProps) {
  const isMobile = useIsMobile();
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Sync local filters when modal opens
  useMemo(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  // Popular filter combinations for quick selection
  const popularFilterCombinations = [
    { label: 'Near LAU Byblos', filters: { cities: ['Byblos'], universities: ['LAU Byblos'] } },
    { label: 'Near AUB', filters: { cities: ['Beirut'], universities: ['AUB'] } },
    { label: 'Under $400', filters: { priceRange: [0, 400] as [number, number] } },
    { label: 'Female Only', filters: { genderPreference: ['Female'] } },
    { label: 'With Shuttle', filters: { cities: ['Byblos'], shuttle: 'available' as const } },
    { label: 'Has WiFi & AC', filters: { amenities: ['WiFi', 'Air Conditioning'] } },
  ];

  // Real-time count calculation based on localFilters using actual rooms data
  const previewCount = useMemo(() => {
    if (!dorms || !Array.isArray(dorms)) return 0;
    if (!rooms || !Array.isArray(rooms)) return 0;
    
    // First, get valid dorm IDs based on dorm-level filters
    const validDormIds = new Set(
      dorms.filter(dorm => {
        // City filter
        if (localFilters.cities.length > 0) {
          const dormCity = dorm.area?.toLowerCase().includes('beirut') ? 'Beirut' : 'Byblos';
          if (!localFilters.cities.includes(dormCity)) return false;
        }

        // Area filter
        if (localFilters.areas.length > 0) {
          if (!localFilters.areas.some(area => dorm.area?.toLowerCase().includes(area.toLowerCase()))) return false;
        }

        // Gender filter
        if (localFilters.genderPreference.length > 0) {
          if (!localFilters.genderPreference.includes(dorm.gender_preference)) return false;
        }

        // Shuttle filter (only for Byblos)
        if (localFilters.shuttle === 'available' && !dorm.shuttle) return false;
        if (localFilters.shuttle === 'none' && dorm.shuttle) return false;

        // University filter
        if (localFilters.universities.length > 0) {
          if (!localFilters.universities.some(uni => dorm.university?.includes(uni))) return false;
        }

        // Amenities filter
        if (localFilters.amenities.length > 0) {
          const dormAmenities = dorm.amenities || [];
          if (!localFilters.amenities.every(a => dormAmenities.some((da: string) => da.toLowerCase().includes(a.toLowerCase())))) return false;
        }

        return true;
      }).map(d => d.id)
    );
    
    // Count rooms that match room-level filters
    return rooms.filter(room => {
      // Must belong to a valid dorm
      if (!validDormIds.has(room.dorm_id)) return false;
      
      // Price filter
      const price = room.price || 0;
      if (price < localFilters.priceRange[0] || price > localFilters.priceRange[1]) return false;
      
      // Room type filter - use substring matching
      if (localFilters.roomTypes.length > 0) {
        const roomTypeMatches = localFilters.roomTypes.some(filterType => 
          matchesRoomTypeFilter(room.type, filterType)
        );
        if (!roomTypeMatches) return false;
      }
      
      // Capacity filter
      if (localFilters.capacity) {
        if ((room.capacity || 0) < localFilters.capacity) return false;
      }
      
      return true;
    }).length;
  }, [dorms, rooms, localFilters]);

  const selectedCity = localFilters.cities.length === 1 ? localFilters.cities[0] : null;
  const isByblos = selectedCity === 'Byblos';
  const isBeirut = selectedCity === 'Beirut';

  const visibleAreas = isByblos ? byblosAreas : isBeirut ? beirutAreas : [];
  const visibleUniversities = isByblos ? byblosUniversities : isBeirut ? beirutUniversities : [];

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'universities' | 'areas' | 'roomTypes' | 'genderPreference' | 'amenities', value: string) => {
    setLocalFilters(prev => {
      const current = prev[key] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleCitySelect = (city: string) => {
    setLocalFilters(prev => ({
      ...prev,
      cities: prev.cities.includes(city) ? [] : [city],
      // Clear dependent filters when city changes
      areas: [],
      universities: [],
      shuttle: 'all'
    }));
  };


  const handleClearAll = () => {
    const defaultFilters: Filters = {
      priceRange: [0, 2000],
      universities: [],
      areas: [],
      roomTypes: [],
      capacity: undefined,
      cities: [],
      shuttle: 'all',
      genderPreference: [],
      amenities: [],
      electricity24_7: false,
      wifiIncluded: false,
      hasWashingMachine: false,
      hasDryingMachine: false
    };
    setLocalFilters(defaultFilters);
    onFilterChange(defaultFilters);  // Apply to parent immediately
    onOpenChange(false);              // Close modal
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onOpenChange(false);
  };

  const resultLabel = 'Rooms';

  // Check if any filters are different from default
  const hasActiveFilters = useMemo(() => {
    return (
      localFilters.priceRange[0] !== 0 ||
      localFilters.priceRange[1] !== 2000 ||
      localFilters.universities.length > 0 ||
      localFilters.areas.length > 0 ||
      localFilters.roomTypes.length > 0 ||
      localFilters.capacity !== undefined ||
      localFilters.cities.length > 0 ||
      localFilters.shuttle !== 'all' ||
      localFilters.genderPreference.length > 0 ||
      localFilters.amenities.length > 0 ||
      localFilters.electricity24_7 === true
    );
  }, [localFilters]);

  const filterContent = (
    <div className="space-y-8">

      {/* Popular Filters Quick-Select */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Popular Filters</h3>
        <div className="flex flex-wrap gap-2">
          {popularFilterCombinations.map((combo) => (
            <button
              key={combo.label}
              onClick={() => setLocalFilters(prev => ({ ...prev, ...combo.filters }))}
              className="px-4 py-2 rounded-full border text-sm transition-all bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 hover:border-primary hover:shadow-md"
            >
              ✨ {combo.label}
            </button>
          ))}
        </div>
      </section>

      <hr className="border-border" />
      
      {/* Budget Section */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Budget</h3>
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${localFilters.priceRange[0]}</span>
            <span>${localFilters.priceRange[1]}</span>
          </div>
          <Slider
            value={localFilters.priceRange}
            onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
            min={0}
            max={2000}
            step={50}
            className="mt-2"
          />
          <div className="flex flex-wrap gap-2">
            {budgetPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => updateFilter('priceRange', [preset.min, preset.max])}
                className={cn(
                  "px-4 py-2 rounded-full border text-sm transition-colors",
                  localFilters.priceRange[0] === preset.min && localFilters.priceRange[1] === preset.max
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:border-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <hr className="border-border" />

      {/* City Section - comes right after Budget */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">City</h3>
        <div className="flex gap-3">
          {['Byblos', 'Beirut'].map((city) => (
            <button
              key={city}
              onClick={() => handleCitySelect(city)}
              className={cn(
                "flex-1 px-6 py-3 rounded-xl border text-sm font-medium transition-colors",
                localFilters.cities.includes(city)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              )}
            >
              {city}
            </button>
          ))}
        </div>
      </section>

      {/* BYBLOS: Area → Gender → Shuttle */}
      {isByblos && (
        <>
          <hr className="border-border" />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Area</h3>
            <div className="flex flex-wrap gap-2">
              {byblosAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArrayFilter('areas', area)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    localFilters.areas.includes(area)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-border" />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Gender Preference</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'Male', label: '♂ Male Only' },
                { value: 'Female', label: '♀ Female Only' },
                { value: 'Mixed', label: '⚥ Co-ed' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleArrayFilter('genderPreference', option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    localFilters.genderPreference.includes(option.value)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-border" />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Shuttle Service</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'available', label: 'Shuttle Available' },
                { value: 'none', label: 'No Shuttle' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('shuttle', option.value as 'all' | 'available' | 'none')}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    localFilters.shuttle === option.value
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* BEIRUT: Area → Gender */}
      {isBeirut && (
        <>
          <hr className="border-border" />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Area</h3>
            <div className="flex flex-wrap gap-2">
              {beirutAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleArrayFilter('areas', area)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    localFilters.areas.includes(area)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </section>

          <hr className="border-border" />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Gender Preference</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'Male', label: '♂ Male Only' },
                { value: 'Female', label: '♀ Female Only' },
                { value: 'Mixed', label: '⚥ Co-ed' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleArrayFilter('genderPreference', option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    localFilters.genderPreference.includes(option.value)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Gender Preference - when no city selected */}
      {!isByblos && !isBeirut && (
        <>
          <hr className="border-border" />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Gender Preference</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'Male', label: '♂ Male Only' },
                { value: 'Female', label: '♀ Female Only' },
                { value: 'Mixed', label: '⚥ Co-ed' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleArrayFilter('genderPreference', option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    localFilters.genderPreference.includes(option.value)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <hr className="border-border" />

      {/* Room Type Section */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Room Type</h3>
        <div className="flex flex-wrap gap-2">
          {studentRoomTypesForFilters.map((type) => (
            <button
              key={type}
              onClick={() => toggleArrayFilter('roomTypes', type)}
              className={cn(
                "px-4 py-2 rounded-full border text-sm transition-colors",
                localFilters.roomTypes.includes(type)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </section>


      {/* Universities Section - Conditional on City */}
      {(isByblos || isBeirut) && visibleUniversities.length > 0 && (
        <>
          <hr className="border-border" />
          <section className="space-y-4">
            <h3 className="text-base font-semibold">Universities</h3>
            <div className="flex flex-wrap gap-2">
              {visibleUniversities.map((uni) => (
                <button
                  key={uni}
                  onClick={() => toggleArrayFilter('universities', uni)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-colors",
                    localFilters.universities.includes(uni)
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:border-foreground"
                  )}
                >
                  {uni}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <hr className="border-border" />

      {/* Special Requirements Section */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Special Requirements</h3>
        
        {/* 24/7 Electricity */}
        <button
          onClick={() => updateFilter('electricity24_7', !localFilters.electricity24_7)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors w-full",
            localFilters.electricity24_7
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:border-foreground"
          )}
        >
          <Zap className="h-5 w-5" />
          <div className="text-left">
            <span className="font-medium">24/7 Electricity</span>
            <p className={cn(
              "text-xs mt-0.5",
              localFilters.electricity24_7 ? "text-background/70" : "text-muted-foreground"
            )}>
              Uninterrupted power supply
            </p>
          </div>
        </button>

        {/* WiFi Included */}
        <button
          onClick={() => updateFilter('wifiIncluded', !localFilters.wifiIncluded)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-colors w-full",
            localFilters.wifiIncluded
              ? "bg-foreground text-background border-foreground"
              : "border-border hover:border-foreground"
          )}
        >
          <Wifi className="h-5 w-5" />
          <div className="text-left">
            <span className="font-medium">WiFi Included</span>
            <p className={cn(
              "text-xs mt-0.5",
              localFilters.wifiIncluded ? "text-background/70" : "text-muted-foreground"
            )}>
              Internet included in rent
            </p>
          </div>
        </button>

        {/* Laundry machines */}
        <div className="flex gap-3">
          <button
            onClick={() => updateFilter('hasWashingMachine', !localFilters.hasWashingMachine)}
            className={cn(
              "flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors",
              localFilters.hasWashingMachine
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:border-foreground"
            )}
          >
            <WashingMachine className="h-5 w-5" />
            <span className="font-medium">Washing</span>
          </button>
          <button
            onClick={() => updateFilter('hasDryingMachine', !localFilters.hasDryingMachine)}
            className={cn(
              "flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors",
              localFilters.hasDryingMachine
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:border-foreground"
            )}
          >
            <Thermometer className="h-5 w-5" />
            <span className="font-medium">Dryer</span>
          </button>
        </div>
      </section>

      <hr className="border-border" />

      {/* Amenities Section */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold">Amenities</h3>
        
        {/* Popular amenities always visible */}
        <div className="flex flex-wrap gap-3">
          {popularAmenities.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => toggleArrayFilter('amenities', name)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors",
                localFilters.amenities.includes(name)
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:border-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {name}
            </button>
          ))}
        </div>

        {/* Show more/less button */}
        <button
          onClick={() => setShowAllAmenities(!showAllAmenities)}
          className="flex items-center gap-1 text-sm font-medium underline underline-offset-4 hover:text-muted-foreground transition-colors"
        >
          {showAllAmenities ? 'Show less' : 'Show more'}
          {showAllAmenities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {/* Expanded amenities by category */}
        {showAllAmenities && (
          <div className="space-y-6 pt-2">
            {Object.entries(amenityCategories).map(([category, amenities]) => (
              category !== 'Popular' && (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">{category}</h4>
                  <div className="flex flex-wrap gap-3">
                    {amenities.map(({ name, icon: Icon }) => (
                      <button
                        key={name}
                        onClick={() => toggleArrayFilter('amenities', name)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors",
                          localFilters.amenities.includes(name)
                            ? "bg-foreground text-background border-foreground"
                            : "border-border hover:border-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </section>

    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        onClick={handleClearAll}
        disabled={!hasActiveFilters}
        className={cn(
          "font-medium underline underline-offset-4",
          !hasActiveFilters && "text-muted-foreground/50 no-underline cursor-not-allowed"
        )}
      >
        Clear all
      </Button>
      <Button
        onClick={handleApply}
        className="px-6 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium"
      >
        Show {previewCount} {resultLabel}
      </Button>
    </div>
  );

  // Mobile: Use Drawer (slides up from bottom like Airbnb)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[95vh] flex flex-col">
          {/* Fixed Header */}
          <DrawerHeader className="flex-shrink-0 border-b border-border px-4 py-3 relative">
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
            <DrawerTitle className="text-base font-semibold text-center">Filters</DrawerTitle>
          </DrawerHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {filterContent}
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t border-border px-4 py-3 bg-background">
            {footerContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden bg-background border-border">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="text-lg font-semibold text-center">Filters</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {filterContent}
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 bg-background">
          {footerContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
