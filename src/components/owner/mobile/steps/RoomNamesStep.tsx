import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2 } from 'lucide-react';

export interface WizardRoomData {
  id: string;
  name: string;
  type: string;
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
}

interface RoomNamesStepProps {
  rooms: WizardRoomData[];
  onChange: (rooms: WizardRoomData[]) => void;
}

export function RoomNamesStep({ rooms, onChange }: RoomNamesStepProps) {
  const updateRoomName = (index: number, name: string) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], name };
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

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
            Name your rooms
          </h1>
          <p className="text-muted-foreground">
            Each room needs a unique name or number
          </p>
        </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
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
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className="bg-card border border-border rounded-xl p-3"
              >
                <span className="text-xs text-muted-foreground mb-1 block">
                  Room {index + 1}
                </span>
                <Input
                  value={room.name}
                  onChange={(e) => updateRoomName(index, e.target.value)}
                  placeholder="Name"
                  className="h-9 rounded-lg text-sm"
                />
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
