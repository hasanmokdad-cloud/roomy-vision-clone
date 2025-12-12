import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronUp, Wifi, Car, Snowflake, Dumbbell, ShieldCheck, UtensilsCrossed, BookOpen, Trees, Users, Zap, Droplets, Building2, Armchair, PawPrint, Sparkles, Waves, Flower2, DoorOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
  residenceType?: 'room' | 'apartment' | null;
}

interface AirbnbFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  totalResults: number;
}

// Data
const byblosAreas = [
  'Nahr Ibrahim', 'Byblos', 'Halat', 'Jeddayel', 'Mastita', 'Fidar', 'Habboub'
];

const beirutAreas = [
  'Hamra', 'Manara', 'Ain El Mraisseh', 'Raoucheh', 'Ras Beirut', 'UNESCO',
  'Geitawi', 'Dora', 'Badaro', 'Ashrafieh', 'Verdun', 'Sin El Fil', 'Dekwaneh',
  'Jdeideh', 'Mar Elias', 'Borj Hammoud', 'Hazmieh', 'Furn El Chebbak',
  'Tayouneh', 'Jnah', "Ras Al Naba'a", 'Gemmayze', 'Clemenceau', 'Khalde'
];

const byblosUniversities = ['LAU Byblos'];
const beirutUniversities = ['LAU Beirut', 'AUB', 'NDU', 'USJ', 'BAU', 'LU Hadat', 'Balamand Dekwaneh', 'Balamand ALBA', 'Haigazian', 'USEK'];

const roomTypesWithoutApartment = [
  'Single', 'Double', 'Triple', 'Junior Suite', 'Royal Suite',
  'Standard Single', 'High Standard Single', 'Standard Double', 'High Standard Double',
  'Small Single', 'Medium Single', 'Large Single', 'Small Double', 'Medium Double',
  'Large Double', 'Large Quadruple'
];

const budgetPresets = [
  { label: '<$300', min: 0, max: 300 },
  { label: '$300-$500', min: 300, max: 500 },
  { label: '$500-$800', min: 500, max: 800 },
  { label: '>$800', min: 800, max: 2000 }
];

const capacityOptions = [1, 2, 3, 4, 5, 6];

// Amenity categories with icons
const amenityCategories = {
  'Popular': [
    { name: 'WiFi', icon: Wifi },
    { name: 'Parking', icon: Car },
    { name: 'Air Conditioning', icon: Snowflake },
  ],
  'Essentials': [
    { name: 'Laundry', icon: Droplets },
    { name: 'Kitchen', icon: UtensilsCrossed },
    { name: 'Furnished', icon: Armchair },
    { name: 'Heating', icon: Zap },
  ],
  'Facilities': [
    { name: 'Gym', icon: Dumbbell },
    { name: 'Study Room', icon: BookOpen },
    { name: 'Common Area', icon: Users },
    { name: 'Elevator', icon: Building2 },
  ],
  'Safety & Services': [
    { name: 'Security', icon: ShieldCheck },
    { name: 'Cleaning Service', icon: Sparkles },
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
  totalResults
}: AirbnbFiltersModalProps) {
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // Sync local filters when modal opens
  useMemo(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

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

  const handleResidenceTypeSelect = (type: 'room' | 'apartment') => {
    setLocalFilters(prev => ({
      ...prev,
      residenceType: prev.residenceType === type ? null : type,
      // Clear room types when switching
      roomTypes: []
    }));
  };

  const handleClearAll = () => {
    setLocalFilters({
      priceRange: [0, 2000],
      universities: [],
      areas: [],
      roomTypes: [],
      capacity: undefined,
      cities: [],
      shuttle: 'all',
      genderPreference: [],
      amenities: [],
      residenceType: null
    });
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onOpenChange(false);
  };

  const resultLabel = localFilters.residenceType === 'apartment' ? 'Apartments' : 'Rooms';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden bg-background border-border">
        {/* Fixed Header */}
        <DialogHeader className="flex-shrink-0 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <DialogTitle className="text-lg font-semibold">Filters</DialogTitle>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            
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

            {/* Capacity Section */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold">Capacity</h3>
              <div className="flex flex-wrap gap-2">
                {capacityOptions.map((cap) => (
                  <button
                    key={cap}
                    onClick={() => updateFilter('capacity', localFilters.capacity === cap ? undefined : cap)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm transition-colors min-w-[80px]",
                      localFilters.capacity === cap
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {cap}{cap === 6 ? '+' : ''} {cap === 1 ? 'student' : 'students'}
                  </button>
                ))}
              </div>
            </section>

            <hr className="border-border" />

            {/* City Section */}
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

            {/* Shuttle Service - Only if Byblos selected */}
            {isByblos && (
              <>
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

            <hr className="border-border" />

            {/* Gender Preference Section */}
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

            {/* Area Section - Conditional on City */}
            {(isByblos || isBeirut) && visibleAreas.length > 0 && (
              <>
                <hr className="border-border" />
                <section className="space-y-4">
                  <h3 className="text-base font-semibold">Area</h3>
                  <div className="flex flex-wrap gap-2">
                    {visibleAreas.map((area) => (
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
              </>
            )}

            <hr className="border-border" />

            {/* Residence Type Section */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold">Residence Type</h3>
              <div className="flex gap-3">
                {[
                  { value: 'room' as const, label: 'Room' },
                  { value: 'apartment' as const, label: 'Apartment' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleResidenceTypeSelect(option.value)}
                    className={cn(
                      "flex-1 px-6 py-3 rounded-xl border text-sm font-medium transition-colors",
                      localFilters.residenceType === option.value
                        ? "bg-foreground text-background border-foreground"
                        : "border-border hover:border-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Room Type Section - Only if Room selected */}
            {localFilters.residenceType === 'room' && (
              <>
                <hr className="border-border" />
                <section className="space-y-4">
                  <h3 className="text-base font-semibold">Room Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {roomTypesWithoutApartment.map((type) => (
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
              </>
            )}

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
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 flex items-center justify-between bg-background">
          <Button
            variant="ghost"
            onClick={handleClearAll}
            className="font-medium underline underline-offset-4"
          >
            Clear all
          </Button>
          <Button
            onClick={handleApply}
            className="px-6 py-3 bg-foreground text-background hover:bg-foreground/90 rounded-lg font-medium"
          >
            Show {totalResults}+ {resultLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
