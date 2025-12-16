import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { WizardTopBar } from './WizardTopBar';
import { WizardFooter } from './WizardFooter';
import { IntroStep } from './steps/IntroStep';
import { StepOverview } from './steps/StepOverview';
import { PropertyTypeStep } from './steps/PropertyTypeStep';
import { LocationStep } from './steps/LocationStep';
import { CapacityStep } from './steps/CapacityStep';
import { AmenitiesStep } from './steps/AmenitiesStep';
import { GenderPreferenceStep } from './steps/GenderPreferenceStep';
import { PhotosStep } from './steps/PhotosStep';
import { DescriptionStep } from './steps/DescriptionStep';
import { ReviewStep } from './steps/ReviewStep';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MobileDormWizardProps {
  onBeforeSubmit?: () => Promise<string | null>;
  onSaved: () => void;
  isSubmitting?: boolean;
}

interface WizardFormData {
  propertyType: string;
  area: string;
  address: string;
  nearUniversity: boolean;
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

const TOTAL_STEPS = 16;

export function MobileDormWizard({ onBeforeSubmit, onSaved, isSubmitting }: MobileDormWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<WizardFormData>({
    propertyType: '',
    area: '',
    address: '',
    nearUniversity: false,
    capacity: 1,
    amenities: [],
    genderPreference: '',
    coverImage: '',
    galleryImages: [],
    highlights: [],
    title: '',
    description: '',
  });

  // Load saved progress
  useEffect(() => {
    const loadSavedProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${user.id}`);
      if (saved) {
        try {
          const { step, formData: savedData } = JSON.parse(saved);
          setCurrentStep(step);
          setFormData(savedData);
        } catch (e) {
          console.error('Failed to parse saved wizard data');
        }
      }
    };
    loadSavedProgress();
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
        name: formData.title || `${formData.propertyType} in ${formData.area}`,
        dorm_name: formData.title || `${formData.propertyType} in ${formData.area}`,
        address: formData.address,
        area: formData.area || null,
        description: formData.description || null,
        image_url: formData.coverImage || null,
        cover_image: formData.coverImage || null,
        location: formData.area || formData.address,
        capacity: formData.capacity,
        amenities: formData.amenities,
        shuttle: formData.nearUniversity,
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
      case 2: return !formData.propertyType;
      case 3: return !formData.area;
      case 4: return formData.capacity < 1;
      case 9: return !formData.genderPreference;
      case 10: return !formData.coverImage || formData.galleryImages.length < 2;
      case 15: return !formData.title || !formData.area || !formData.propertyType;
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
        return <IntroStep onGetStarted={handleNext} />;
      case 1:
        return <StepOverview phase={1} />;
      case 2:
        return (
          <PropertyTypeStep
            value={formData.propertyType}
            onChange={(v) => setFormData({ ...formData, propertyType: v })}
          />
        );
      case 3:
        return (
          <LocationStep
            area={formData.area}
            address={formData.address}
            nearUniversity={formData.nearUniversity}
            onAreaChange={(v) => setFormData({ ...formData, area: v })}
            onAddressChange={(v) => setFormData({ ...formData, address: v })}
            onNearUniversityChange={(v) => setFormData({ ...formData, nearUniversity: v })}
          />
        );
      case 4:
        return (
          <CapacityStep
            value={formData.capacity}
            onChange={(v) => setFormData({ ...formData, capacity: v })}
          />
        );
      case 5:
        return <StepOverview phase={2} />;
      case 6:
        return (
          <AmenitiesStep
            category="essentials"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 7:
        return (
          <AmenitiesStep
            category="shared"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 8:
        return (
          <AmenitiesStep
            category="safety"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 9:
        return (
          <GenderPreferenceStep
            value={formData.genderPreference}
            onChange={(v) => setFormData({ ...formData, genderPreference: v })}
          />
        );
      case 10:
        return (
          <PhotosStep
            coverImage={formData.coverImage}
            galleryImages={formData.galleryImages}
            onCoverChange={(v) => setFormData({ ...formData, coverImage: v })}
            onGalleryChange={(v) => setFormData({ ...formData, galleryImages: v })}
          />
        );
      case 11:
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
      case 12:
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
      case 13:
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
      case 14:
        return <StepOverview phase={3} />;
      case 15:
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
  const showFooter = currentStep > 0;

  return (
    <div className="min-h-screen bg-background">
      <WizardTopBar onSaveExit={handleSaveExit} onHelp={() => setShowHelpDialog(true)} />

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
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save and exit?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress has been saved. You can come back anytime to finish your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Save & exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help dialog */}
      <AlertDialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Need help?</AlertDialogTitle>
            <AlertDialogDescription>
              If you have any questions about listing your dorm, feel free to contact us at support@roomylb.com or visit our Help Center.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
