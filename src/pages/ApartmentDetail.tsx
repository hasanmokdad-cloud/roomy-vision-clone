import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Users, BedDouble, Bath, ArrowLeft, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApartmentDetail } from '@/hooks/useApartmentDetail';
import { useApartmentPhotos } from '@/hooks/useApartmentPhotos';
import { ApartmentPhotoCollage } from '@/components/apartments/ApartmentPhotoCollage';
import { ApartmentPricingCard } from '@/components/apartments/ApartmentPricingCard';
import { HostInfoCard } from '@/components/apartments/HostInfoCard';
import { BedroomInfoCard } from '@/components/apartments/BedroomInfoCard';
import { AmenitiesGrid } from '@/components/apartments/AmenitiesGrid';
import { SpacesSection } from '@/components/apartments/SpacesSection';
import { ThingsToKnow } from '@/components/apartments/ThingsToKnow';
import { toast } from 'sonner';

export default function ApartmentDetail() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const navigate = useNavigate();
  const { apartment, loading, error } = useApartmentDetail(apartmentId || '');
  const { collagePhotos, sections } = useApartmentPhotos(apartment);

  const handleBack = () => {
    navigate(-1);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: apartment?.name,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleSave = () => {
    toast.success('Saved to wishlist');
  };

  const handleReserve = () => {
    if (apartment) {
      navigate(`/apartments/${apartment.id}/reserve`);
    }
  };

  const handleContact = () => {
    if (apartment?.owner) {
      toast.info('Opening chat with owner...');
      // Navigate to messages or open chat modal
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'Apartment not found'}</p>
        <Button onClick={handleBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Back Button */}
      <div className="md:hidden sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 h-14 flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="ml-2 font-medium truncate">{apartment.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Desktop Title */}
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">
            {apartment.name}
          </h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            {apartment.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{apartment.location}</span>
              </div>
            )}
            {apartment.university && (
              <Badge variant="secondary" className="gap-1">
                <GraduationCap className="h-3 w-3" />
                Near {apartment.university}
              </Badge>
            )}
          </div>
        </div>

        {/* Photo Collage */}
        <ApartmentPhotoCollage
          apartmentId={apartment.id}
          photos={collagePhotos}
          onShare={handleShare}
          onSave={handleSave}
        />

        {/* Mobile Title */}
        <div className="md:hidden mt-6">
          <h1 className="text-xl font-semibold mb-2">{apartment.name}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {apartment.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{apartment.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Capacity Summary */}
            <div className="flex items-center gap-4 text-muted-foreground pb-6 border-b">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{apartment.maxCapacity} guest{apartment.maxCapacity !== 1 ? 's' : ''}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <BedDouble className="h-4 w-4" />
                <span>{apartment.bedroomCount} bedroom{apartment.bedroomCount !== 1 ? 's' : ''}</span>
              </div>
              <span>·</span>
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{apartment.bathroomCount} bath{apartment.bathroomCount !== 1 ? 's' : ''}</span>
              </div>
              {apartment.areaM2 && (
                <>
                  <span>·</span>
                  <span>{apartment.areaM2} m²</span>
                </>
              )}
            </div>

            {/* Host Info */}
            {apartment.owner && (
              <HostInfoCard 
                owner={apartment.owner} 
                buildingName={apartment.buildingName}
              />
            )}

            {/* Description */}
            {apartment.description && (
              <div className="py-6 border-b">
                <h3 className="text-xl font-semibold mb-4">About this place</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {apartment.description}
                </p>
              </div>
            )}

            {/* Spaces Section */}
            {sections.length > 0 && (
              <SpacesSection 
                apartmentId={apartment.id} 
                sections={sections} 
              />
            )}

            {/* Bedrooms */}
            {apartment.bedrooms.length > 0 && (
              <div className="py-6 border-b">
                <h3 className="text-xl font-semibold mb-4">Where you'll sleep</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {apartment.bedrooms.map((bedroom, index) => (
                    <BedroomInfoCard 
                      key={bedroom.id} 
                      bedroom={bedroom} 
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {apartment.amenities.length > 0 && (
              <AmenitiesGrid amenities={apartment.amenities} />
            )}

            {/* Things to Know */}
            <ThingsToKnow
              houseRules={apartment.houseRules}
              safetyFeatures={apartment.safetyFeatures}
              cancellationPolicy={apartment.cancellationPolicy}
            />
          </div>

          {/* Right Column - Pricing Card (Desktop) */}
          <div className="hidden lg:block">
            <ApartmentPricingCard
              apartment={apartment}
              onReserve={handleReserve}
              onContact={handleContact}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-4 safe-area-pb">
        <div className="flex items-center justify-between gap-4">
          <div>
            {apartment.pricingTiers.length > 0 && (
              <div className="text-lg font-semibold">
                ${Math.min(...apartment.pricingTiers.map(t => t.monthlyPrice))}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </div>
            )}
          </div>
          <Button size="lg" onClick={handleReserve}>
            Reserve
          </Button>
        </div>
      </div>
    </div>
  );
}
