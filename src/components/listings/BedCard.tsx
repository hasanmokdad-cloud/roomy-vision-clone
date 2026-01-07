import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble, CheckCircle, XCircle, DollarSign } from 'lucide-react';

interface BedCardProps {
  bed: {
    id: string;
    label: string;
    bedType: string;
    monthlyPrice?: number;
    deposit?: number;
    available: boolean;
    capacityContribution: number;
  };
  canReserve: boolean;
  isBedroomReservedAsWhole?: boolean;  // NEW: When bedroom is reserved, hide this bed
  index: number;
  onReserve: () => void;
}

const BedCardComponent = ({
  bed,
  canReserve,
  isBedroomReservedAsWhole = false,
  index,
  onReserve,
}: BedCardProps) => {
  // Bed type color based on type
  const bedTypeColor = useMemo(() => {
    switch (bed.bedType) {
      case 'single': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'double': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'master': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'king': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'bunk': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  }, [bed.bedType]);

  // Strict availability: bed is available only if not reserved and bedroom not reserved as whole
  const isAvailable = bed.available && canReserve && !isBedroomReservedAsWhole;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Card className={`overflow-hidden transition-all duration-300 ${
        isAvailable 
          ? 'glass-hover border-border hover:border-primary/50' 
          : 'opacity-60 bg-muted/30'
      }`}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-muted-foreground" />
              <h5 className="font-semibold text-foreground">{bed.label}</h5>
            </div>
            <Badge 
              variant={isAvailable ? 'default' : 'secondary'} 
              className={isAvailable ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
            >
              {isAvailable ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Available
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 mr-1" />
                  Taken
                </>
              )}
            </Badge>
          </div>

          {/* Bed Type - Descriptive Only */}
          <div className="flex items-center gap-2">
            <Badge className={`${bedTypeColor} capitalize text-xs`}>
              {bed.bedType}
            </Badge>
            <span className="text-xs text-muted-foreground">(descriptive)</span>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-lg font-bold text-foreground">${bed.monthlyPrice || 0}</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            {bed.deposit && (
              <div className="text-sm text-muted-foreground">
                Deposit: ${bed.deposit}
              </div>
            )}
          </div>

          {/* Reserve Button */}
          {isAvailable && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onReserve();
              }}
              size="sm"
              className="w-full"
            >
              Reserve Bed
            </Button>
          )}

          {/* Not Available Message - More specific */}
          {!isAvailable && (
            <p className="text-xs text-muted-foreground text-center italic">
              {isBedroomReservedAsWhole 
                ? '🔒 Bedroom reserved as whole' 
                : !bed.available 
                  ? 'Already reserved' 
                  : 'Not available'}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const BedCard = memo(BedCardComponent);
