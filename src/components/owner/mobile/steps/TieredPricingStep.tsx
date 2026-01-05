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
  onChange: (rooms: WizardRoomData[]) => void;
}

export function TieredPricingStep({ rooms, onChange }: TieredPricingStepProps) {
  const [price1Student, setPrice1Student] = useState('');
  const [deposit1Student, setDeposit1Student] = useState('');
  const [price2Students, setPrice2Students] = useState('');
  const [deposit2Students, setDeposit2Students] = useState('');
  const [applied, setApplied] = useState(false);

  // Filter rooms that need tiered pricing (Double or Triple)
  const tieredRooms = useMemo(() => {
    return rooms.filter(r => {
      const type = r.type?.toLowerCase() || '';
      return type.includes('double') || type.includes('triple');
    });
  }, [rooms]);

  const doubleRooms = tieredRooms.filter(r => r.type?.toLowerCase().includes('double'));
  const tripleRooms = tieredRooms.filter(r => r.type?.toLowerCase().includes('triple'));

  const applyToDoubleRooms = () => {
    const updated = rooms.map(room => {
      if (room.type?.toLowerCase().includes('double')) {
        return {
          ...room,
          price_1_student: price1Student ? parseFloat(price1Student) : null,
          deposit_1_student: deposit1Student ? parseFloat(deposit1Student) : null,
        };
      }
      return room;
    });
    onChange(updated);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  const applyToTripleRooms = () => {
    const updated = rooms.map(room => {
      if (room.type?.toLowerCase().includes('triple')) {
        return {
          ...room,
          price_1_student: price1Student ? parseFloat(price1Student) : null,
          deposit_1_student: deposit1Student ? parseFloat(deposit1Student) : null,
          price_2_students: price2Students ? parseFloat(price2Students) : null,
          deposit_2_students: deposit2Students ? parseFloat(deposit2Students) : null,
        };
      }
      return room;
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
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            No tiered pricing needed
          </h1>
          <p className="text-muted-foreground">
            You don't have any Double or Triple rooms that require tiered pricing. Continue to the next step.
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
          Set tiered pricing
        </h1>
        <p className="text-muted-foreground">
          Different prices when fewer students occupy a shared room
        </p>
      </motion.div>

      <ScrollArea className="h-[calc(100vh-250px)]">
        <div className="space-y-6 pr-4">
          {/* Double Rooms Section */}
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
                  ({doubleRooms.length} room{doubleRooms.length !== 1 ? 's' : ''})
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Price for 1 student</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={price1Student}
                        onChange={(e) => setPrice1Student(e.target.value)}
                        placeholder="0"
                        className="pl-9 h-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Deposit for 1 student</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={deposit1Student}
                        onChange={(e) => setDeposit1Student(e.target.value)}
                        placeholder="0"
                        className="pl-9 h-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={applyToDoubleRooms}
                  disabled={!price1Student && !deposit1Student}
                  className="w-full rounded-xl gap-2"
                >
                  {applied ? <Check className="w-4 h-4" /> : 'Apply to Double Rooms'}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Triple Rooms Section */}
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
                  ({tripleRooms.length} room{tripleRooms.length !== 1 ? 's' : ''})
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm mb-2 block">Price (1 student)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={price1Student}
                        onChange={(e) => setPrice1Student(e.target.value)}
                        placeholder="0"
                        className="pl-9 h-10 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Deposit (1 student)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={deposit1Student}
                        onChange={(e) => setDeposit1Student(e.target.value)}
                        placeholder="0"
                        className="pl-9 h-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm mb-2 block">Price (2 students)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={price2Students}
                        onChange={(e) => setPrice2Students(e.target.value)}
                        placeholder="0"
                        className="pl-9 h-10 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Deposit (2 students)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={deposit2Students}
                        onChange={(e) => setDeposit2Students(e.target.value)}
                        placeholder="0"
                        className="pl-9 h-10 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={applyToTripleRooms}
                  disabled={!price1Student && !deposit1Student && !price2Students && !deposit2Students}
                  className="w-full rounded-xl gap-2"
                >
                  {applied ? <Check className="w-4 h-4" /> : 'Apply to Triple Rooms'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
