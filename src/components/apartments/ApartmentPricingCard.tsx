import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, CalendarCheck } from 'lucide-react';
import type { ApartmentDetailData } from '@/types/apartmentDetail';

interface ApartmentPricingCardProps {
  apartment: ApartmentDetailData;
  onReserve: () => void;
  onContact: () => void;
  canReserveFullApartment?: boolean;
}

function ApartmentPricingCardComponent({
  apartment,
  onReserve,
  onContact,
  canReserveFullApartment = true,
}: ApartmentPricingCardProps) {
  // Calculate starting price
  const getStartingPrice = () => {
    if (apartment.pricingTiers.length > 0) {
      return Math.min(...apartment.pricingTiers.map(t => t.monthlyPrice));
    }
    if (apartment.bedrooms.length > 0) {
      const bedroomPrices = apartment.bedrooms
        .filter(b => b.bedroomPrice)
        .map(b => b.bedroomPrice!);
      if (bedroomPrices.length > 0) {
        return Math.min(...bedroomPrices);
      }
    }
    return null;
  };

  const getDeposit = () => {
    if (apartment.pricingTiers.length > 0) {
      const tier = apartment.pricingTiers[0];
      return tier.deposit;
    }
    return null;
  };

  const startingPrice = getStartingPrice();
  const deposit = getDeposit();

  return (
    <Card className="border shadow-lg sticky top-24">
      <CardContent className="p-6">
        {/* Price */}
        <div className="mb-4">
          {startingPrice ? (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold">${startingPrice}</span>
              <span className="text-muted-foreground">/ month</span>
            </div>
          ) : (
            <span className="text-lg font-medium">Contact for pricing</span>
          )}
        </div>

        {/* Capacity */}
        <div className="text-sm text-muted-foreground mb-4">
          {apartment.bedroomCount} bedroom{apartment.bedroomCount !== 1 ? 's' : ''} · 
          Up to {apartment.maxCapacity} guest{apartment.maxCapacity !== 1 ? 's' : ''}
        </div>

        <Separator className="my-4" />

        {/* Reserve Button */}
        {apartment.enableFullApartmentReservation && canReserveFullApartment && (
          <Button 
            className="w-full mb-3" 
            size="lg"
            onClick={onReserve}
          >
            <CalendarCheck className="h-4 w-4 mr-2" />
            Reserve
          </Button>
        )}

        {/* Contact Button */}
        <Button 
          variant="outline" 
          className="w-full"
          size="lg"
          onClick={onContact}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Owner
        </Button>

        {/* Deposit Info */}
        {deposit && deposit > 0 && (
          <>
            <Separator className="my-4" />
            <div className="text-sm text-muted-foreground text-center">
              Deposit: <span className="font-medium text-foreground">${deposit}</span>
              <span className="block text-xs mt-1">(non-refundable)</span>
            </div>
          </>
        )}

        {/* Cancellation Policy Preview */}
        {apartment.cancellationPolicy && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {apartment.cancellationPolicy}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const ApartmentPricingCard = memo(ApartmentPricingCardComponent);
