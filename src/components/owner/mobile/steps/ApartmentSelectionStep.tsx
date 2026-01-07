import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle, Building2 } from 'lucide-react';
import { WizardApartmentData, APARTMENT_TYPES } from '@/types/apartment';

interface ApartmentSelectionStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  completedIds?: string[];
  onSelectionChange: (ids: string[]) => void;
}

function isApartmentComplete(apt: WizardApartmentData): boolean {
  return !!(
    apt.maxCapacity > 0 &&
    apt.bedroomCount > 0 &&
    apt.bedrooms.length > 0 &&
    apt.bedrooms.every(br => br.baseCapacity > 0)
  );
}

export function ApartmentSelectionStep({
  apartments,
  selectedIds,
  completedIds = [],
  onSelectionChange,
}: ApartmentSelectionStepProps) {
  const uniqueTypes = useMemo(() => {
    const types = apartments.map(a => a.type).filter(Boolean);
    return [...new Set(types)];
  }, [apartments]);

  const incompleteApartments = useMemo(() => 
    apartments.filter(a => !completedIds.includes(a.id)),
    [apartments, completedIds]
  );
  
  const completedApartments = useMemo(() => 
    apartments.filter(a => completedIds.includes(a.id)),
    [apartments, completedIds]
  );

  const selectByType = (type: string) => {
    if (!type) return;
    const idsOfType = incompleteApartments.filter(a => a.type === type).map(a => a.id);
    onSelectionChange(idsOfType);
  };

  const selectAll = () => {
    onSelectionChange(incompleteApartments.map(a => a.id));
  };

  const toggleApartment = (apartmentId: string) => {
    onSelectionChange(
      selectedIds.includes(apartmentId)
        ? selectedIds.filter(id => id !== apartmentId)
        : [...selectedIds, apartmentId]
    );
  };

  const selectedCount = selectedIds.length;
  const allComplete = incompleteApartments.length === 0;

  const getTypeLabel = (typeValue: string) => {
    return APARTMENT_TYPES.find(t => t.value === typeValue)?.label || typeValue;
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
                Select apartments to configure
              </h1>
              <p className="text-muted-foreground">
                Choose apartments for batch setup
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4"
        >
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">
              {completedApartments.length} of {apartments.length} apartments complete
            </span>
          </div>
        </motion.div>

        {allComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              All apartments configured!
            </h2>
            <p className="text-muted-foreground">
              Continue to upload media and review.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Filter options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-3 mb-4"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Select by type:</span>
                <Select onValueChange={selectByType}>
                  <SelectTrigger className="flex-1 h-10 rounded-xl">
                    <SelectValue placeholder="Choose type" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueTypes.map(type => (
                      <SelectItem key={type} value={type}>{getTypeLabel(type)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-primary hover:underline"
                >
                  Select all incomplete
                </button>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedCount} apartment{selectedCount !== 1 ? 's' : ''} selected
                  </Badge>
                )}
              </div>
            </motion.div>

            <ScrollArea className="h-[calc(100vh-450px)]">
              <div className="space-y-3 pr-4">
                {/* Incomplete apartments */}
                {incompleteApartments.map((apt, index) => (
                  <motion.div
                    key={apt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`bg-card border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                      selectedIds.includes(apt.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border'
                    }`}
                    onClick={() => toggleApartment(apt.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(apt.id)}
                      onCheckedChange={() => toggleApartment(apt.id)}
                      className="h-5 w-5"
                    />
                    <Circle className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-foreground block truncate">
                        {apt.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {apt.type && (
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(apt.type)}
                          </Badge>
                        )}
                        {apt.bedroomCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {apt.bedroomCount} bedroom{apt.bedroomCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Completed apartments */}
                {completedApartments.length > 0 && (
                  <>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide pt-4 pb-2">
                      Completed
                    </div>
                    {completedApartments.map((apt, index) => (
                      <motion.div
                        key={apt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (incompleteApartments.length + index) * 0.02 }}
                        className={`bg-muted/50 border rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                          selectedIds.includes(apt.id) 
                            ? 'border-primary bg-primary/5 opacity-100' 
                            : 'border-border opacity-60'
                        }`}
                        onClick={() => toggleApartment(apt.id)}
                      >
                        <Checkbox
                          checked={selectedIds.includes(apt.id)}
                          onCheckedChange={() => toggleApartment(apt.id)}
                          className="h-5 w-5"
                        />
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-foreground block truncate">
                            {apt.name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {apt.type && (
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(apt.type)}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {apt.bedroomCount} bedroom{apt.bedroomCount !== 1 ? 's' : ''} • Cap: {apt.maxCapacity}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
