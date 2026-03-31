import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, AlertCircle } from 'lucide-react';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';

export interface BedConfigRow {
  bedType: 'single' | 'double' | 'twin';
  quantity: number;
}

export interface SuiteBedroomConfig {
  label: string;
  capacity: 'single' | 'double' | 'twin' | 'triple';
  bedConfig: BedConfigRow[];
}

export interface WizardRoomData {
  id: string;
  name: string;
  type: string; // canonical label
  baseType?: string; // 'room' | 'studio'
  capacityType?: string; // 'single' | 'double' | 'twin' | 'triple' | 'quadruple' | 'suite'
  size?: string; // 'small' | 'medium' | 'large' | ''
  bedType?: string;
  price: number | null;
  deposit: number | null;
  price_1_student: number | null;
  price_2_students: number | null;
  deposit_1_student: number | null;
  deposit_2_students: number | null;
  capacity: number | null;
  capacity_occupied: number;
  area_m2: number | null;
  images: string[];
  video_url: string | null;
  is_furnished?: boolean | null;
  has_balcony?: boolean | null;
  suite_has_kitchenette?: boolean | null;
  suite_bathroom_count?: number;
  bed_configuration?: BedConfigRow[];
  suite_bedrooms?: SuiteBedroomConfig[];
  tiered_pricing_enabled?: boolean;
  pricing_tiers?: { occupancy: number; price: number | null; deposit: number | null }[];
  space_images?: Record<string, string[]>; // space_type -> urls
}

interface RoomNamesStepProps {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
  propertyType?: string;
  hasMultipleBlocks?: boolean;
  currentBlockNumber?: number;
}

// Pattern detection for auto-sequencing
function detectPattern(name: string): { type: string; prefix: string; suffix: string; num: number; padLength: number } | null {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();

  // "Room 1", "Unit 5" — text + space + integer
  const textNumMatch = trimmed.match(/^(.+\s)(\d+)$/);
  if (textNumMatch) {
    return { type: 'text_num', prefix: textNumMatch[1], suffix: '', num: parseInt(textNumMatch[2], 10), padLength: 0 };
  }

  // "101A", "2B" — number + letter suffix
  const numLetterMatch = trimmed.match(/^(\d+)([A-Za-z]+)$/);
  if (numLetterMatch) {
    return { type: 'num_letter', prefix: '', suffix: numLetterMatch[2], num: parseInt(numLetterMatch[1], 10), padLength: numLetterMatch[1].length > 1 ? numLetterMatch[1].length : 0 };
  }

  // "A01", "B2" — letter prefix + number (possibly zero-padded)
  const letterNumMatch = trimmed.match(/^([A-Za-z]+)(\d+)$/);
  if (letterNumMatch) {
    const numStr = letterNumMatch[2];
    return { type: 'letter_num', prefix: letterNumMatch[1], suffix: '', num: parseInt(numStr, 10), padLength: numStr.length };
  }

  // Pure integer "100", "5"
  const pureIntMatch = trimmed.match(/^(\d+)$/);
  if (pureIntMatch) {
    return { type: 'pure_int', prefix: '', suffix: '', num: parseInt(pureIntMatch[1], 10), padLength: 0 };
  }

  return null;
}

function generateName(pattern: { type: string; prefix: string; suffix: string; num: number; padLength: number }, offset: number): string {
  const nextNum = pattern.num + offset;
  const numStr = pattern.padLength > 0
    ? String(nextNum).padStart(pattern.padLength, '0')
    : String(nextNum);

  switch (pattern.type) {
    case 'text_num': return `${pattern.prefix}${numStr}`;
    case 'num_letter': return `${numStr}${pattern.suffix}`;
    case 'letter_num': return `${pattern.prefix}${numStr}`;
    case 'pure_int': return numStr;
    default: return '';
  }
}

export function RoomNamesStep({ rooms, onChange, propertyType = 'dorm', hasMultipleBlocks = false, currentBlockNumber = 1 }: RoomNamesStepProps) {
  const { roomsLabel, roomLabel } = usePropertyTerminology(propertyType);
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const updateRoomName = (index: number, name: string) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], name };
    onChange(updated);

    // Debounce auto-sequence
    if (debounceTimers.current[index]) clearTimeout(debounceTimers.current[index]);
    debounceTimers.current[index] = setTimeout(() => {
      autoSequenceFrom(index, name, updated);
    }, 400);
  };

  const handleBlur = (index: number) => {
    if (debounceTimers.current[index]) clearTimeout(debounceTimers.current[index]);
    autoSequenceFrom(index, rooms[index].name, rooms);
  };

  const autoSequenceFrom = (fromIndex: number, name: string, currentRooms: WizardRoomData[]) => {
    const pattern = detectPattern(name);
    if (!pattern) return;

    const updated = [...currentRooms];
    const existingNames = new Set(updated.map((r, i) => i !== fromIndex && r.name.trim() ? r.name.trim() : null).filter(Boolean));
    let offset = 1;

    for (let i = fromIndex + 1; i < updated.length; i++) {
      // Only fill empty inputs
      if (updated[i].name.trim()) continue;

      let candidate = generateName(pattern, offset);
      // Skip collisions
      while (existingNames.has(candidate)) {
        offset++;
        candidate = generateName(pattern, offset);
        if (offset > updated.length + 100) break; // safety
      }

      updated[i] = { ...updated[i], name: candidate };
      existingNames.add(candidate);
      offset++;
    }
    onChange(updated);
  };

  const autoFillNumbers = () => {
    const updated = rooms.map((room, index) => ({
      ...room,
      name: String(index + 1)
    }));
    onChange(updated);
  };

  const autoFillLetterNumbers = () => {
    const updated = rooms.map((room, index) => {
      const letter = String.fromCharCode(65 + Math.floor(index / 10));
      const num = (index % 10) + 1;
      return { ...room, name: `${letter}${num}` };
    });
    onChange(updated);
  };

  // Check for duplicate names
  const getDuplicates = (): Set<string> => {
    const names = rooms.map(r => r.name.trim()).filter(Boolean);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const n of names) {
      if (seen.has(n)) dupes.add(n);
      seen.add(n);
    }
    return dupes;
  };
  const duplicates = getDuplicates();

  const heading = hasMultipleBlocks
    ? `Name the rooms in Block ${currentBlockNumber}`
    : 'Name your rooms';

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            {heading}
          </h1>
          <p className="text-muted-foreground">
            Give each rental unit a unique name or number
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6 justify-center"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={autoFillNumbers}
            className="gap-2 rounded-xl"
          >
            <Wand2 className="w-4 h-4" />
            1, 2, 3...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={autoFillLetterNumbers}
            className="gap-2 rounded-xl"
          >
            <Wand2 className="w-4 h-4" />
            A1, A2, B1...
          </Button>
        </motion.div>

        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-4">
            {rooms.map((room, index) => {
              const isDuplicate = room.name.trim() && duplicates.has(room.name.trim());
              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  className="bg-card border border-border rounded-xl p-3"
                >
                  <span className="text-xs text-muted-foreground mb-1 block">
                    Room {index + 1}
                  </span>
                  <Input
                    value={room.name}
                    onChange={(e) => updateRoomName(index, e.target.value)}
                    onBlur={() => handleBlur(index)}
                    placeholder={`Room ${index + 1}`}
                    className={`h-9 rounded-lg text-sm ${isDuplicate ? 'border-destructive' : ''}`}
                  />
                  {isDuplicate && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-destructive" />
                      <span className="text-[10px] text-destructive">This name is already used by another unit.</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
