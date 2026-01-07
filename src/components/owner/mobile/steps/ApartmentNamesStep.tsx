import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wand2, Building2 } from 'lucide-react';
import { WizardApartmentData } from '@/types/apartment';

interface ApartmentNamesStepProps {
  apartments: WizardApartmentData[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function ApartmentNamesStep({ apartments, onChange }: ApartmentNamesStepProps) {
  const updateApartmentName = (index: number, name: string) => {
    const updated = [...apartments];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  };

  const autoFillNumbers = () => {
    const updated = apartments.map((apt, index) => ({
      ...apt,
      name: `A${index + 1}`
    }));
    onChange(updated);
  };

  const autoFillBlockNumbers = () => {
    const updated = apartments.map((apt, index) => {
      const block = String.fromCharCode(65 + Math.floor(index / 10)); // A, B, C...
      const num = (index % 10) + 1;
      return { ...apt, name: `${block}${num}` };
    });
    onChange(updated);
  };

  const autoFillFloorNumbers = () => {
    const updated = apartments.map((apt, index) => {
      const floor = Math.floor(index / 4) + 1;
      const unit = (index % 4) + 1;
      return { ...apt, name: `${floor}0${unit}` };
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
                Name your apartments
              </h1>
              <p className="text-muted-foreground">
                Each apartment needs a unique name or number
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={autoFillNumbers}
            className="gap-2 rounded-xl"
          >
            <Wand2 className="w-4 h-4" />
            A1, A2, A3...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={autoFillBlockNumbers}
            className="gap-2 rounded-xl"
          >
            <Wand2 className="w-4 h-4" />
            A1, A2... B1, B2...
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={autoFillFloorNumbers}
            className="gap-2 rounded-xl"
          >
            <Wand2 className="w-4 h-4" />
            101, 102... 201...
          </Button>
        </motion.div>

        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-4">
            {apartments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className="bg-card border border-border rounded-xl p-3"
              >
                <span className="text-xs text-muted-foreground mb-1 block">
                  Apt {index + 1}
                </span>
                <Input
                  value={apt.name}
                  onChange={(e) => updateApartmentName(index, e.target.value)}
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
