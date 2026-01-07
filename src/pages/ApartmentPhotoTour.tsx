import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useApartmentDetail } from '@/hooks/useApartmentDetail';
import { useApartmentPhotos } from '@/hooks/useApartmentPhotos';
import { PhotoTourHeader } from '@/components/apartments/PhotoTourHeader';
import { SpaceCategoryChips } from '@/components/apartments/SpaceCategoryChips';
import { PhotoSection } from '@/components/apartments/PhotoSection';
import { toast } from 'sonner';

export default function ApartmentPhotoTour() {
  const { apartmentId } = useParams<{ apartmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { apartment, loading, error } = useApartmentDetail(apartmentId || '');
  const { sections } = useApartmentPhotos(apartment);
  
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isScrollingRef = useRef(false);

  // Handle hash navigation on mount
  useEffect(() => {
    if (location.hash && sections.length > 0) {
      const match = location.hash.match(/#section-(\d+)/);
      if (match) {
        const index = parseInt(match[1], 10);
        if (index < sections.length) {
          setTimeout(() => {
            scrollToSection(index);
          }, 100);
        }
      }
    }
  }, [location.hash, sections.length]);

  // Intersection Observer for sticky label
  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.findIndex((ref) => ref === entry.target);
            if (index !== -1) {
              setActiveSection(index);
            }
          }
        });
      },
      {
        rootMargin: '-100px 0px -80% 0px',
        threshold: 0,
      }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [sections.length]);

  const scrollToSection = useCallback((index: number) => {
    const ref = sectionRefs.current[index];
    if (ref) {
      isScrollingRef.current = true;
      setActiveSection(index);
      
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
  }, []);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: apartment?.name,
        url: window.location.href.replace('/photos', ''),
      });
    } catch {
      navigator.clipboard.writeText(window.location.href.replace('/photos', ''));
      toast.success('Link copied to clipboard');
    }
  };

  const handleSave = () => {
    toast.success('Saved to wishlist');
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
        <button 
          onClick={() => navigate(-1)}
          className="text-primary underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No photos available</p>
        <button 
          onClick={() => navigate(`/apartments/${apartmentId}`)}
          className="text-primary underline"
        >
          Back to apartment
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PhotoTourHeader
        apartmentName={apartment.name}
        apartmentId={apartment.id}
        onShare={handleShare}
        onSave={handleSave}
      />

      {/* Category Chips */}
      <SpaceCategoryChips
        sections={sections}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />

      {/* Content Layout */}
      <div className="flex">
        {/* Sticky Section Label - Desktop Only */}
        <div className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-32 p-6">
            <h3 className="text-lg font-semibold text-muted-foreground">
              {sections[activeSection]?.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {sections[activeSection]?.photos.length} photo{sections[activeSection]?.photos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Photo Sections */}
        <div className="flex-1 max-w-4xl mx-auto px-4 py-8 space-y-16">
          {/* Mobile Section Label */}
          <div className="lg:hidden sticky top-[104px] bg-background/95 backdrop-blur-sm py-2 z-5">
            <h3 className="font-semibold">{sections[activeSection]?.label}</h3>
          </div>

          {sections.map((section, index) => (
            <PhotoSection
              key={`${section.spaceType}-${section.spaceInstance || index}`}
              ref={(el) => {
                sectionRefs.current[index] = el;
              }}
              section={section}
              index={index}
            />
          ))}
        </div>

        {/* Right spacer for symmetry on desktop */}
        <div className="hidden lg:block w-48 shrink-0" />
      </div>
    </div>
  );
}
