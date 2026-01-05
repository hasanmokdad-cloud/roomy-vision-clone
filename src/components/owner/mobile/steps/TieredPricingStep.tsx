import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Check, Users } from 'lucide-react';
import { WizardRoomData } from './RoomNamesStep';

interface TieredPricingStepProps {
  rooms: WizardRoomData[];
  selectedIds: string[];
  onChange: (rooms: WizardRoomData[]) => void;
}

export function TieredPricingStep({ rooms, selectedIds, onChange }: TieredPricingStepProps) {
  const [price1Student, setPrice1Student] = useState('');
  const [deposit1Student, setDeposit1Student] = useState('');
  const [price2Students, setPrice2Students] = useState('');
  const [deposit2Students, setDeposit2Students] = useState('');
  const [applied, setApplied] = useState(false);

  // Filter to only show Double/Triple rooms from current selection
  const tieredRooms = useMemo(() => {
    return rooms.filter(r => {
      if (!selectedIds.includes(r.id)) return false;
      const type = r.type?.toLowerCase() || '';
      return type.includes('double') || type.includes('triple');
    });
  }, [rooms, selectedIds]);

  const doubleRooms = tieredRooms.filter(r => r.type?.toLowerCase().includes('double'));
  const tripleRooms = tieredRooms.filter(r => r.type?.toLowerCase().includes('triple'));

  const applyToDoubles = () => {
    if (!price1Student && !deposit1Student) return;
    const updated = rooms.map(room => {
      if (!selectedIds.includes(room.id)) return room;
      const type = room.type?.toLowerCase() || '';
      if (!type.includes('double')) return room;
      return {
        ...room,
        price_1_student: price1Student ? parseFloat(price1Student) : room.price_1_student,
        deposit_1_student: deposit1Student ? parseFloat(deposit1Student) : room.deposit_1_student,
      };
    });
    onChange(updated);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const applyToTriples = () => {
    if (!price1Student && !deposit1Student && !price2Students && !deposit2Students) return;
    const updated = rooms.map(room => {
      if (!selectedIds.includes(room.id)) return room;
      const type = room.type?.toLowerCase() || '';
      if (!type.includes('triple')) return room;
      return {
        ...room,
        price_1_student: price1Student ? parseFloat(price1Student) : room.price_1_student,
        deposit_1_student: deposit1Student ? parseFloat(deposit1Student) : room.deposit_1_student,
        price_2_students: price2Students ? parseFloat(price2Students) : room.price_2_students,
        deposit_2_students: deposit2Students ? parseFloat(deposit2Students) : room.deposit_2_students,
      };
    });
    onChange(updated);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  if (tieredRooms.length === 0) {
    return (
      <div className="px-6 pt-24 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            No tiered pricing needed
          </h1>
          <p className="text-muted-foreground">
            The selected rooms don't require tiered pricing. Tiered pricing applies to Double and Triple rooms only.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Tiered pricing
        </h1>
        <p className="text-muted-foreground">
          Set discounted prices when fewer students occupy a room
        </p>
      </motion.div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-6 pr-4">
          {/* Double rooms section */}
          {doubleRooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">Double Rooms</Badge>
                <span className="text-sm text-muted-foreground">
                  {doubleRooms.length} room{doubleRooms.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Price for 1 student (instead of 2)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={price1Student}
                      onChange={(e) => setPrice1Student(e.target.value)}
                      placeholder="e.g., 350"
                      className="pl-9 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Deposit for 1 student
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={deposit1Student}
                      onChange={(e) => setDeposit1Student(e.target.value)}
                      placeholder="e.g., 150"
                      className="pl-9 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  onClick={applyToDoubles}
                  disabled={!price1Student && !deposit1Student}
                  className="w-full h-12 rounded-xl gap-2"
                >
                  {applied ? <Check className="w-4 h-4" /> : 'Apply to Double Rooms'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Triple rooms section */}
          {tripleRooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">Triple Rooms</Badge>
                <span className="text-sm text-muted-foreground">
                  {tripleRooms.length} room{tripleRooms.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Price for 1 student (instead of 3)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={price1Student}
                      onChange={(e) => setPrice1Student(e.target.value)}
                      placeholder="e.g., 250"
                      className="pl-9 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Price for 2 students (instead of 3)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={price2Students}
                      onChange={(e) => setPrice2Students(e.target.value)}
                      placeholder="e.g., 400"
                      className="pl-9 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Deposit for 1 student
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={deposit1Student}
                      onChange={(e) => setDeposit1Student(e.target.value)}
                      placeholder="e.g., 100"
                      className="pl-9 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Deposit for 2 students
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={deposit2Students}
                      onChange={(e) => setDeposit2Students(e.target.value)}
                      placeholder="e.g., 150"
                      className="pl-9 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  onClick={applyToTriples}
                  disabled={!price1Student && !deposit1Student && !price2Students && !deposit2Students}
                  className="w-full h-12 rounded-xl gap-2"
                >
                  {applied ? <Check className="w-4 h-4" /> : 'Apply to Triple Rooms'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Room preview */}
          <div className="flex flex-wrap gap-2 pt-2">
            {tieredRooms.slice(0, 6).map(room => (
              <Badge key={room.id} variant="outline" className="text-xs">
                {room.name} {room.price_1_student ? `✓` : ''}
              </Badge>
            ))}
            {tieredRooms.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{tieredRooms.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
