import { } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RotateCcw } from 'lucide-react';

interface FiltersPanelProps {
  filters: {
    priceRange: [number, number];
    universities: string[];
    areas: string[];
    roomTypes: string[];
    capacity?: number;
    cities?: string[];
    shuttle?: 'all' | 'available' | 'none';
  };
  onFilterChange: (filters: any) => void;
  dorms: any[];
}

const universities = [
  'LAU (Byblos)',
  'LAU (Beirut)',
  'AUB',
  'USEK',
  'USJ',
  'LU (Hadat)',
  'Balamand (Dekwaneh)',
  'Balamand (ALBA)',
  'BAU',
  'Haigazian',
  'NDU'
];

const byblosAreas = [
  'Nahr Ibrahim',
  'Byblos',
  'Halat',
  'Jeddayel',
  'Mastita',
  'Fidar',
  'Habboub'
];

const beirutAreas = [
  'Hamra',
  'Manara',
  'Ain El Mraisseh',
  'Raoucheh',
  'Ras Beirut',
  'UNESCO',
  'Geitawi',
  'Dora',
  'Badaro',
  'Ashrafieh',
  'Verdun',
  'Sin El Fil',
  'Dekwaneh',
  'Jdeideh',
  'Mar Elias',
  'Borj Hammoud',
  'Hazmieh',
  'Furn El Chebbak',
  'Tayouneh',
  'Jnah',
  'Ras Al Naba\'a',
  'Gemmayze',
  'Clemenceau',
  'Khalde'
];

const areas = [...byblosAreas, ...beirutAreas].sort();

const budgetPresets = [
  { label: '<$300', min: 0, max: 300 },
  { label: '$300-$500', min: 300, max: 500 },
  { label: '$500-$800', min: 500, max: 800 },
  { label: '>$800', min: 800, max: 2000 }
];

const capacityOptions = [1, 2, 3, 4, 5, 6];

// Whitelist of acceptable room types in order
const acceptableRoomTypes = [
  'Single',
  'Double',
  'Triple',
  'Apartment',
  'Junior Suite',
  'Royal Suite',
  'Standard Single',
  'High Standard Single',
  'Standard Double',
  'High Standard Double',
  'Small Single',
  'Medium Single',
  'Large Single',
  'Small Double',
  'Medium Double',
  'Large Double',
  'Large Quadruple'
];

export default function FiltersPanel({ filters, onFilterChange, dorms }: FiltersPanelProps) {
  const handleReset = () => {
    onFilterChange({
      priceRange: [0, 2000],
      universities: [],
      areas: [],
      roomTypes: [],
      capacity: undefined,
      cities: [],
      shuttle: 'all'
    });
  };

  const toggleFilter = (category: 'universities' | 'areas' | 'roomTypes' | 'cities', value: string) => {
    const current = filters[category] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [category]: updated });
  };

  return (
    <aside 
      className="glass-hover neon-border rounded-2xl p-6 space-y-6 sticky top-24 shadow-xl"
      role="search"
      aria-label="Filter dorm listings"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black gradient-text" id="filters-heading">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset} 
          className="hover:neon-glow"
          aria-label="Reset all filters"
        >
          <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
          Reset
        </Button>
      </div>

      {/* City Filter */}
      <fieldset className="space-y-3" role="group" aria-labelledby="city-filter-label">
        <Label id="city-filter-label" className="text-base font-semibold">City</Label>
        <div className="space-y-2" role="group" aria-label="City options">
          {['Byblos', 'Beirut'].map(city => (
            <div key={city} className="flex items-center space-x-2 hover:bg-white/5 p-2 rounded transition-colors">
              <Checkbox
                id={`city-${city}`}
                checked={filters.cities?.includes(city) || false}
                onCheckedChange={() => toggleFilter('cities', city)}
                aria-label={`Filter by ${city}`}
              />
              <label
                htmlFor={`city-${city}`}
                className="text-sm cursor-pointer flex-1"
              >
                {city}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Shuttle Filter */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Shuttle Service</Label>
        <div className="space-y-2">
          {['all', 'available', 'none'].map((option) => (
            <div key={option} className="flex items-center space-x-2 hover:bg-white/5 p-2 rounded transition-colors">
              <Checkbox
                id={`shuttle-${option}`}
                checked={filters.shuttle === option}
                onCheckedChange={() => onFilterChange({ ...filters, shuttle: option as 'all' | 'available' | 'none' })}
              />
              <label
                htmlFor={`shuttle-${option}`}
                className="text-sm cursor-pointer flex-1 capitalize"
              >
                {option === 'all' ? 'All' : option === 'available' ? 'Shuttle Available' : 'No Shuttle'}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Capacity Filter */}
      <fieldset className="space-y-3" role="group" aria-labelledby="capacity-filter-label">
        <Label id="capacity-filter-label" className="text-base">
          Capacity {filters.capacity ? `(${filters.capacity}${filters.capacity === 6 ? '+' : ''} ${filters.capacity === 1 ? 'student' : 'students'})` : '(Any)'}
        </Label>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Room capacity options">
          {capacityOptions.map((cap) => (
            <button
              key={cap}
              onClick={() => onFilterChange({ 
                ...filters, 
                capacity: filters.capacity === cap ? undefined : cap 
              })}
              className={`glass-hover px-3 py-2 rounded-lg text-sm transition-all ${
                filters.capacity === cap 
                  ? 'bg-primary/20 border-2 border-primary' 
                  : 'border border-white/10'
              }`}
              aria-label={`Filter by ${cap}${cap === 6 ? '+' : ''} ${cap === 1 ? 'student' : 'students'}`}
              aria-pressed={filters.capacity === cap}
              role="button"
            >
              {cap} {cap === 1 ? 'student' : 'students'}{cap === 6 ? '+' : ''}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Budget Filter */}
      <fieldset className="space-y-3" role="group" aria-labelledby="budget-filter-label">
        <Label id="budget-filter-label" className="text-base font-semibold">
          Budget: ${filters.priceRange[0]} - ${filters.priceRange[1]}
        </Label>
        <Slider
          value={filters.priceRange}
          onValueChange={(value) => onFilterChange({ ...filters, priceRange: value as [number, number] })}
          min={0}
          max={2000}
          step={50}
          className="mt-2"
          aria-label={`Budget range from $${filters.priceRange[0]} to $${filters.priceRange[1]}`}
        />
        <div className="grid grid-cols-2 gap-2 mt-3" role="group" aria-label="Budget preset options">
          {budgetPresets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onFilterChange({ ...filters, priceRange: [preset.min, preset.max] })}
              className={`glass-hover px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:neon-glow ${
                filters.priceRange[0] === preset.min && filters.priceRange[1] === preset.max
                  ? 'neon-border bg-primary/10'
                  : 'border border-white/10'
              }`}
              aria-label={`Set budget to ${preset.label}`}
              aria-pressed={filters.priceRange[0] === preset.min && filters.priceRange[1] === preset.max}
              role="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Universities */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">University</Label>
        <ScrollArea className="h-48 rounded-lg border border-white/10 p-2">
          <div className="space-y-2">
            {universities.map(uni => (
              <div key={uni} className="flex items-center space-x-2 hover:bg-white/5 p-1 rounded transition-colors">
                <Checkbox
                  id={`uni-${uni}`}
                  checked={filters.universities.includes(uni)}
                  onCheckedChange={() => toggleFilter('universities', uni)}
                />
                <label
                  htmlFor={`uni-${uni}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {uni}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Areas */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Area</Label>
        <ScrollArea className="h-48 rounded-lg border border-white/10 p-2">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-primary/70 px-1 py-1">Byblos Areas</div>
            {byblosAreas.map(area => (
              <div key={area} className="flex items-center space-x-2 hover:bg-white/5 p-1 rounded transition-colors">
                <Checkbox
                  id={`area-${area}`}
                  checked={filters.areas.includes(area)}
                  onCheckedChange={() => toggleFilter('areas', area)}
                />
                <label
                  htmlFor={`area-${area}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {area}
                </label>
              </div>
            ))}
            <div className="text-xs font-semibold text-primary/70 px-1 py-1 mt-2">Beirut Areas</div>
            {beirutAreas.map(area => (
              <div key={area} className="flex items-center space-x-2 hover:bg-white/5 p-1 rounded transition-colors">
                <Checkbox
                  id={`area-${area}`}
                  checked={filters.areas.includes(area)}
                  onCheckedChange={() => toggleFilter('areas', area)}
                />
                <label
                  htmlFor={`area-${area}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {area}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Room Types */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Room Type</Label>
        <ScrollArea className="h-48 rounded-lg border border-white/10 p-2">
          <div className="space-y-2">
            {acceptableRoomTypes.map(type => (
              <div key={type} className="flex items-center space-x-2 hover:bg-white/5 p-1 rounded transition-colors">
                <Checkbox
                  id={`room-${type}`}
                  checked={filters.roomTypes.includes(type)}
                  onCheckedChange={() => toggleFilter('roomTypes', type)}
                />
                <label
                  htmlFor={`room-${type}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
