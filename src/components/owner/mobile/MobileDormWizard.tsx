import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AirbnbWizardTopBar } from './AirbnbWizardTopBar';
import { WizardFooter } from './WizardFooter';
import { AirbnbIntroStep } from './AirbnbIntroStep';
import { AirbnbStepTransition } from './AirbnbStepTransition';
import { LocationStep } from './steps/LocationStep';
import { CapacityStep } from './steps/CapacityStep';
import { AmenitiesStep } from './steps/AmenitiesStep';
import { GenderPreferenceStep } from './steps/GenderPreferenceStep';
import { PhotosStep } from './steps/PhotosStep';
import { DescriptionStep } from './steps/DescriptionStep';
import { ReviewStep } from './steps/ReviewStep';
import { ResponsiveAlertModal } from '@/components/ui/responsive-alert-modal';

interface MobileDormWizardProps {
  onBeforeSubmit?: () => Promise<string | null>;
  onSaved: () => void;
  isSubmitting?: boolean;
}

interface WizardFormData {
  propertyType: string;
  city: string;
  area: string;
  address: string;
  shuttle: boolean;
  capacity: number;
  amenities: string[];
  genderPreference: string;
  coverImage: string;
  galleryImages: string[];
  highlights: string[];
  title: string;
  description: string;
}

const STORAGE_KEY_PREFIX = 'roomy_dorm_wizard_';

// Reduced from 16 to 15 steps (removed PropertyType step)
const TOTAL_STEPS = 15;

// Transition/filler steps (show footer but don't count in regular progress)
const TRANSITION_STEPS = [1, 4, 13];

// Description generation based on highlights
const highlightDescriptions: Record<string, string> = {
  'peaceful': 'A peaceful environment perfect for focused studying and relaxation.',
  'unique': 'A unique living space with distinctive character and charm.',
  'student-friendly': 'Designed with students in mind, offering everything you need for a comfortable stay during your studies.',
  'modern': 'Modern facilities with contemporary amenities and stylish interiors.',
  'central': 'Centrally located with easy access to universities, shops, and public transportation.',
  'spacious': 'Spacious rooms and common areas providing plenty of room to live and study.',
  'cozy': 'A cozy and welcoming atmosphere that feels like home.',
  'affordable': 'Affordable pricing without compromising on quality or comfort.',
};

function generateDescriptionFromHighlights(highlights: string[]): string {
  if (highlights.length === 0) return '';
  
  const descriptions = highlights
    .map(h => highlightDescriptions[h])
    .filter(Boolean);
  
  if (descriptions.length === 0) return '';
  
  return `Welcome to this wonderful dorm! ${descriptions.join(' ')}`;
}

export function MobileDormWizard({ onBeforeSubmit, onSaved, isSubmitting }: MobileDormWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<WizardFormData>({
    propertyType: 'dorm', // Default to 'dorm' since we removed the selection step
    city: '',
    area: '',
    address: '',
    shuttle: false,
    capacity: 1,
    amenities: [],
    genderPreference: '',
    coverImage: '',
    galleryImages: [],
    highlights: [],
    title: '',
    description: '',
  });

  // Track saved progress without auto-navigating
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [savedStep, setSavedStep] = useState(0);

  // Check for saved progress (but don't auto-navigate)
  useEffect(() => {
    const checkSavedProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${user.id}`);
      if (saved) {
        try {
          const { step, formData: savedData } = JSON.parse(saved);
          // Don't auto-navigate - just mark that we have saved progress
          setHasSavedProgress(true);
          setSavedStep(step);
          // Pre-load the form data but stay on step 0 (intro)
          setFormData(prev => ({ ...prev, ...savedData, propertyType: 'dorm' }));
        } catch (e) {
          console.error('Failed to parse saved wizard data');
        }
      }
    };
    checkSavedProgress();
  }, []);

  // Save progress on changes
  useEffect(() => {
    const saveProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || currentStep === 0) return;

      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${user.id}`,
        JSON.stringify({ step: currentStep, formData, timestamp: Date.now() })
      );
    };
    saveProgress();
  }, [currentStep, formData]);

  const clearSavedProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${user.id}`);
    }
  };

  const handleSaveExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    setShowExitDialog(false);
    navigate('/listings');
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    // When moving from highlights step (step 10) to title step (step 11),
    // generate description if not already set
    if (currentStep === 10 && formData.highlights.length > 0 && !formData.description) {
      const generatedDesc = generateDescriptionFromHighlights(formData.highlights);
      setFormData(prev => ({ ...prev, description: generatedDesc }));
    }
    
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let effectiveOwnerId = '';
      
      if (onBeforeSubmit) {
        const newOwnerId = await onBeforeSubmit();
        if (!newOwnerId) {
          setSubmitting(false);
          return;
        }
        effectiveOwnerId = newOwnerId;
      }

      // Build payload
      const payload = {
        owner_id: effectiveOwnerId,
        name: formData.title || `Dorm in ${formData.area}`,
        dorm_name: formData.title || `Dorm in ${formData.area}`,
        address: formData.address,
        area: formData.area || null,
        description: formData.description || null,
        image_url: formData.coverImage || null,
        cover_image: formData.coverImage || null,
        location: formData.city || formData.area || formData.address,
        capacity: formData.capacity,
        amenities: formData.amenities,
        shuttle: formData.shuttle,
        gender_preference: formData.genderPreference,
        gallery_images: formData.galleryImages,
        verification_status: 'Pending',
        available: true,
      };

      const { data: newDormId, error } = await supabase.rpc('insert_owner_dorm', {
        p_owner_id: effectiveOwnerId,
        p_name: payload.name,
        p_dorm_name: payload.dorm_name,
        p_address: payload.address,
        p_area: payload.area,
        p_university: null,
        p_description: payload.description,
        p_image_url: payload.image_url,
        p_cover_image: payload.cover_image,
        p_monthly_price: null,
        p_capacity: payload.capacity,
        p_amenities: payload.amenities,
        p_shuttle: payload.shuttle,
        p_gender_preference: payload.gender_preference,
        p_phone_number: null,
        p_email: null,
        p_website: null,
        p_gallery_images: payload.gallery_images,
      });

      if (error) throw error;

      await clearSavedProgress();
      
      toast({
        title: 'Success!',
        description: 'Your dorm has been submitted for verification.',
      });

      onSaved();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit dorm',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 2: return !formData.city || !formData.area; // Location step now requires city and area
      case 3: return formData.capacity < 1 || formData.capacity > 2000; // Capacity step
      case 8: return !formData.genderPreference; // Gender preference step
      case 9: return !formData.coverImage; // Photos step - only cover is required now
      case 14: return !formData.title || !formData.area; // Review step
      default: return false;
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <AirbnbIntroStep 
            onGetStarted={handleNext} 
            onClearProgress={clearSavedProgress}
            hasSavedProgress={hasSavedProgress}
            onResume={() => setCurrentStep(savedStep)}
          />
        );
      case 1:
        return <AirbnbStepTransition phase={1} />;
      // Step 2: Location (was step 3, PropertyType step removed)
      case 2:
        return (
          <LocationStep
            city={formData.city}
            area={formData.area}
            address={formData.address}
            shuttle={formData.shuttle}
            onCityChange={(v) => setFormData({ ...formData, city: v, area: '', shuttle: false })}
            onAreaChange={(v) => setFormData({ ...formData, area: v })}
            onAddressChange={(v) => setFormData({ ...formData, address: v })}
            onShuttleChange={(v) => setFormData({ ...formData, shuttle: v })}
          />
        );
      // Step 3: Capacity (was step 4)
      case 3:
        return (
          <CapacityStep
            value={formData.capacity}
            onChange={(v) => setFormData({ ...formData, capacity: v })}
          />
        );
      case 4:
        return <AirbnbStepTransition phase={2} />;
      case 5:
        return (
          <AmenitiesStep
            category="essentials"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 6:
        return (
          <AmenitiesStep
            category="shared"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 7:
        return (
          <AmenitiesStep
            category="safety"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 8:
        return (
          <GenderPreferenceStep
            value={formData.genderPreference}
            onChange={(v) => setFormData({ ...formData, genderPreference: v })}
          />
        );
      case 9:
        return (
          <PhotosStep
            coverImage={formData.coverImage}
            galleryImages={formData.galleryImages}
            onCoverChange={(v) => setFormData({ ...formData, coverImage: v })}
            onGalleryChange={(v) => setFormData({ ...formData, galleryImages: v })}
          />
        );
      case 10:
        return (
          <DescriptionStep
            mode="highlights"
            highlights={formData.highlights}
            title={formData.title}
            description={formData.description}
            onHighlightsChange={(v) => setFormData({ ...formData, highlights: v })}
            onTitleChange={(v) => setFormData({ ...formData, title: v })}
            onDescriptionChange={(v) => setFormData({ ...formData, description: v })}
          />
        );
      case 11:
        return (
          <DescriptionStep
            mode="title"
            highlights={formData.highlights}
            title={formData.title}
            description={formData.description}
            onHighlightsChange={(v) => setFormData({ ...formData, highlights: v })}
            onTitleChange={(v) => setFormData({ ...formData, title: v })}
            onDescriptionChange={(v) => setFormData({ ...formData, description: v })}
          />
        );
      case 12:
        return (
          <DescriptionStep
            mode="description"
            highlights={formData.highlights}
            title={formData.title}
            description={formData.description}
            onHighlightsChange={(v) => setFormData({ ...formData, highlights: v })}
            onTitleChange={(v) => setFormData({ ...formData, title: v })}
            onDescriptionChange={(v) => setFormData({ ...formData, description: v })}
          />
        );
      case 13:
        return <AirbnbStepTransition phase={3} />;
      case 14:
        return (
          <ReviewStep
            formData={formData}
            onEditStep={setCurrentStep}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const isTransitionStep = TRANSITION_STEPS.includes(currentStep);
  const showFooter = currentStep > 0; // Show footer on ALL steps after intro (including transitions)
  const showTopBar = currentStep > 0; // Show top bar on ALL steps after intro

  return (
    <div className="min-h-screen bg-white">
      {showTopBar && <AirbnbWizardTopBar onSaveExit={handleSaveExit} />}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {showFooter && (
        <WizardFooter
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handleBack}
          onNext={isLastStep ? handleSubmit : handleNext}
          isNextDisabled={isNextDisabled()}
          isLastStep={isLastStep}
          isSubmitting={submitting || isSubmitting}
        />
      )}

      {/* Exit confirmation dialog */}
      <ResponsiveAlertModal
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        title="Save and exit?"
        description="Your progress has been saved. You can come back anytime to finish your listing."
        cancelText="Cancel"
        confirmText="Save & exit"
        onConfirm={confirmExit}
      />
    </div>
  );
}
