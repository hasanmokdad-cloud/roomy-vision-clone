import { useState, useEffect } from 'react';
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
  'Haigazian'
];

const areas = [
  'Ras Beirut', 'Manara', 'Ain Al Mraiseh', 'Raoucheh', 'Verdun', 'Kraytem',
  'Sanayeh', 'Mar Elias', 'Badaro', 'Forn El Chebbak', 'Tariq El Jdideh',
  'Jnah', 'Borj Hammoud', 'Dekwaneh', 'Jdeideh', 'Hazmieh', 'Tayouneh',
  'UNESCO', 'Aïsha Bakkar', 'Ras Al Naba\'a', 'Geitawi', 'Jbeil', 'Byblos', 'Hamra'
];

export default function FiltersPanel({ filters, onFilterChange, dorms }: FiltersPanelProps) {
  const [roomTypes, setRoomTypes] = useState<string[]>([]);

  useEffect(() => {
    const types = new Set<string>();
    dorms.forEach(dorm => {
      if (dorm.room_types) {
        dorm.room_types.split(',').forEach((type: string) => {
          types.add(type.trim());
        });
      }
    });
    setRoomTypes(Array.from(types).sort());
  }, [dorms]);

  const handleReset = () => {
    onFilterChange({
      priceRange: [0, 2000],
      universities: [],
      areas: [],
      roomTypes: []
    });
  };

  const toggleFilter = (category: 'universities' | 'areas' | 'roomTypes', value: string) => {
    const current = filters[category];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [category]: updated });
  };

  return (
    <div className="glass-hover rounded-2xl p-6 space-y-6 sticky top-24">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-base">
          Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
        </Label>
        <Slider
          value={filters.priceRange}
          onValueChange={(value) => onFilterChange({ ...filters, priceRange: value as [number, number] })}
          min={0}
          max={2000}
          step={50}
          className="mt-2"
        />
      </div>

      {/* Universities */}
      <div className="space-y-3">
        <Label className="text-base">University</Label>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {universities.map(uni => (
              <div key={uni} className="flex items-center space-x-2">
                <Checkbox
                  id={`uni-${uni}`}
                  checked={filters.universities.includes(uni)}
                  onCheckedChange={() => toggleFilter('universities', uni)}
                />
                <label
                  htmlFor={`uni-${uni}`}
                  className="text-sm cursor-pointer"
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
        <Label className="text-base">Area</Label>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {areas.map(area => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={`area-${area}`}
                  checked={filters.areas.includes(area)}
                  onCheckedChange={() => toggleFilter('areas', area)}
                />
                <label
                  htmlFor={`area-${area}`}
                  className="text-sm cursor-pointer"
                >
                  {area}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Room Types */}
      {roomTypes.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base">Room Type</Label>
          <div className="space-y-2">
            {roomTypes.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`room-${type}`}
                  checked={filters.roomTypes.includes(type)}
                  onCheckedChange={() => toggleFilter('roomTypes', type)}
                />
                <label
                  htmlFor={`room-${type}`}
                  className="text-sm cursor-pointer"
                >
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
