import { useState, useEffect, useRef } from 'react';
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
import { PropertyTypeStep } from './steps/PropertyTypeStep';
import { UploadMethodStep } from './steps/UploadMethodStep';
import { ExcelUploadStep } from './steps/ExcelUploadStep';
import { RoomNamesStep, WizardRoomData } from './steps/RoomNamesStep';
import { RoomTypesStep } from './steps/RoomTypesStep';
import { RoomBulkSelectionStep } from './steps/RoomBulkSelectionStep';
import { RoomPricingStep } from './steps/RoomPricingStep';
import { TieredPricingStep } from './steps/TieredPricingStep';
import { RoomAreaStep } from './steps/RoomAreaStep';
import { RoomCapacityStep } from './steps/RoomCapacityStep';
import { RoomOccupancyStep } from './steps/RoomOccupancyStep';
import { RoomMediaStep } from './steps/RoomMediaStep';
import { ResponsiveAlertModal } from '@/components/ui/responsive-alert-modal';
import Step1Video from '@/assets/wizard/step1-animation.mp4';
import Step2Video from '@/assets/wizard/step2-animation.mp4';

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
  uploadMethod: 'manual' | 'excel' | '';
  rooms: WizardRoomData[];
  selectedRoomIds: string[];
  completedRoomIds: string[];
}

const STORAGE_KEY_PREFIX = 'roomy_dorm_wizard_';

// Total steps: 0-25 (26 steps)
// Step order:
// 0: Intro
// 1: Filler Phase 1
// 2: Property Type
// 3: Title
// 4: Gender Preference
// 5: Highlights
// 6: Description
// 7: Filler Phase 2
// 8: Location
// 9-11: Amenities (essentials, shared, safety)
// 12: Photos
// 13: Filler Phase 3
// 14: Capacity (How many rooms?)
// 15: Upload Method (Manual or Excel)
// 16: Excel Upload / Room Names (based on upload method)
// 17: Room Types
// 18: Bulk Selection (for pricing)
// 19: Pricing Setup
// 20: Tiered Pricing (skip if no Double/Triple in selection)
// 21: Area Setup
// 22: Capacity Setup (for non-standard types)
// 23: Occupancy
// 24: Room Media
// 25: Review
const TOTAL_STEPS = 26;

// Transition/filler steps
const TRANSITION_STEPS = [1, 7, 13];

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

function createEmptyRoom(index: number): WizardRoomData {
  return {
    id: `room-${Date.now()}-${index}`,
    name: '',
    type: '',
    price: null,
    deposit: null,
    price_1_student: null,
    price_2_students: null,
    deposit_1_student: null,
    deposit_2_students: null,
    capacity: null,
    capacity_occupied: 0,
    area_m2: null,
    images: [],
    video_url: null,
  };
}

export function MobileDormWizard({ onBeforeSubmit, onSaved, isSubmitting }: MobileDormWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoPreloading, setVideoPreloading] = useState(false);
  const step1VideoRef = useRef<HTMLVideoElement>(null);
  const step2VideoRef = useRef<HTMLVideoElement>(null);

  const [formData, setFormData] = useState<WizardFormData>({
    propertyType: 'dorm',
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
    uploadMethod: '',
    rooms: [],
    selectedRoomIds: [],
    completedRoomIds: [],
  });

  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [savedStep, setSavedStep] = useState(0);
  const [agreedToOwnerTerms, setAgreedToOwnerTerms] = useState(false);

  // Check for saved progress
  useEffect(() => {
    const checkSavedProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${user.id}`);
      if (saved) {
        try {
          const { step, formData: savedData } = JSON.parse(saved);
          setHasSavedProgress(true);
          setSavedStep(step);
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
      // Skip Excel upload step when going back if manual was selected
      if (currentStep === 17 && formData.uploadMethod === 'manual') {
        setCurrentStep(15);
        return;
      }
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper to check if room type has auto-capacity
  const hasAutoCapacity = (type: string): boolean => {
    const t = type?.toLowerCase() || '';
    return t.includes('single') || t.includes('double') || t.includes('triple') || t.includes('quadruple');
  };

  // Helper to check if selected rooms have Double/Triple
  const selectedHasTieredRooms = (): boolean => {
    return formData.rooms.some(r => {
      if (!formData.selectedRoomIds.includes(r.id)) return false;
      const type = r.type?.toLowerCase() || '';
      return type.includes('double') || type.includes('triple');
    });
  };

  // Helper to check if selected rooms need manual capacity
  const selectedNeedsCapacityStep = (): boolean => {
    return formData.rooms.some(r => {
      if (!formData.selectedRoomIds.includes(r.id)) return false;
      return !hasAutoCapacity(r.type);
    });
  };

  // Helper to check if all rooms are complete
  const allRoomsComplete = (): boolean => {
    return formData.rooms.every(r => formData.completedRoomIds.includes(r.id));
  };

  const handleNext = async () => {
    // Special handling for intro → step 1 (preload step 1 video)
    if (currentStep === 0) {
      setVideoPreloading(true);
      
      const video = step1VideoRef.current;
      if (video) {
        await new Promise<void>((resolve) => {
          if (video.readyState >= 3) {
            resolve();
          } else {
            video.oncanplaythrough = () => resolve();
            video.load();
          }
        });
      }
      
      setVideoPreloading(false);
      setCurrentStep(1);
      return;
    }

    // Special handling for step 6 → step 7 (preload step 2 video)
    if (currentStep === 6) {
      setVideoPreloading(true);
      
      const video = step2VideoRef.current;
      if (video) {
        await new Promise<void>((resolve) => {
          if (video.readyState >= 3) {
            resolve();
          } else {
            video.oncanplaythrough = () => resolve();
            video.load();
          }
        });
      }
      
      setVideoPreloading(false);
      setCurrentStep(7);
      return;
    }

    // When moving from highlights step (step 5) to description step (step 6),
    // generate description if not already set
    if (currentStep === 5 && formData.highlights.length > 0 && !formData.description) {
      const generatedDesc = generateDescriptionFromHighlights(formData.highlights);
      setFormData(prev => ({ ...prev, description: generatedDesc }));
    }

    // After capacity step, create empty room objects
    if (currentStep === 14 && formData.rooms.length !== formData.capacity) {
      const rooms = Array.from({ length: formData.capacity }, (_, i) => createEmptyRoom(i));
      setFormData(prev => ({ ...prev, rooms, selectedRoomIds: rooms.map(r => r.id), completedRoomIds: [] }));
    }

    // After upload method, skip to appropriate step
    if (currentStep === 15) {
      if (formData.uploadMethod === 'excel') {
        setCurrentStep(16); // Excel upload step
        return;
      } else {
        setCurrentStep(16); // Room names step (same step number, different content based on method)
        return;
      }
    }

    // From bulk selection step (18), check if all rooms are complete
    if (currentStep === 18) {
      const allComplete = formData.rooms.every(r => formData.completedRoomIds.includes(r.id));
      if (allComplete) {
        setCurrentStep(24); // Go to media step
        return;
      }
    }

    // After pricing step (19), check if tiered pricing needed
    if (currentStep === 19) {
      if (!selectedHasTieredRooms()) {
        // Skip tiered pricing step (20), go to area (21)
        setCurrentStep(21);
        return;
      }
    }

    // After area step (21), check if capacity step needed
    if (currentStep === 21) {
      if (!selectedNeedsCapacityStep()) {
        // Skip capacity step (22), go to occupancy (23)
        setCurrentStep(23);
        return;
      }
    }

    // After occupancy step (23), mark current batch as complete and loop back or proceed
    if (currentStep === 23) {
      // Mark current batch as completed
      const newCompletedIds = [...new Set([...formData.completedRoomIds, ...formData.selectedRoomIds])];
      setFormData(prev => ({ 
        ...prev, 
        completedRoomIds: newCompletedIds,
        selectedRoomIds: [] // Clear selection for next batch
      }));
      
      // Check if all rooms are now complete
      const allComplete = formData.rooms.every(r => newCompletedIds.includes(r.id));
      
      if (allComplete) {
        setCurrentStep(24); // Media step
      } else {
        setCurrentStep(18); // Back to room selection for next batch
      }
      return;
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

      // Create all rooms for this dorm
      if (formData.rooms.length > 0 && newDormId) {
        for (const room of formData.rooms) {
          const roomPayload = {
            dorm_id: newDormId,
            name: room.name || `Room ${formData.rooms.indexOf(room) + 1}`,
            type: room.type || 'Single',
            price: room.price || 0,
            deposit: room.deposit,
            price_1_student: room.price_1_student,
            price_2_students: room.price_2_students,
            deposit_1_student: room.deposit_1_student,
            deposit_2_students: room.deposit_2_students,
            capacity: room.capacity || 1,
            capacity_occupied: room.capacity_occupied || 0,
            area_m2: room.area_m2,
            images: room.images,
            video_url: room.video_url,
            available: true,
          };

          const { error: roomError } = await supabase.functions.invoke('create-room', {
            body: roomPayload
          });

          if (roomError) {
            console.error('Error creating room:', roomError);
          }
        }
      }

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
      case 3: return !formData.title;
      case 4: return !formData.genderPreference;
      case 8: return !formData.city || !formData.area;
      case 12: return !formData.coverImage;
      case 14: return formData.capacity < 1 || formData.capacity > 2000;
      case 15: return !formData.uploadMethod;
      case 16: 
        // For manual: check room names; for excel: check if imported
        if (formData.uploadMethod === 'manual') {
          return formData.rooms.some(r => !r.name);
        }
        return formData.rooms.length === 0;
      case 17: return formData.rooms.some(r => !r.type);
      case 18: 
        // If all rooms complete, allow proceeding to media
        if (formData.completedRoomIds.length === formData.rooms.length && formData.rooms.length > 0) {
          return false;
        }
        return formData.selectedRoomIds.length === 0;
      case 25: return !formData.title || !formData.area || !agreedToOwnerTerms;
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
            isVideoPreloading={videoPreloading}
          />
        );
      case 1:
        return <AirbnbStepTransition phase={1} />;
      case 2:
        return (
          <PropertyTypeStep
            value={formData.propertyType}
            onChange={(v) => setFormData({ ...formData, propertyType: v })}
          />
        );
      case 3:
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
      case 4:
        return (
          <GenderPreferenceStep
            value={formData.genderPreference}
            onChange={(v) => setFormData({ ...formData, genderPreference: v })}
          />
        );
      case 5:
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
      case 6:
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
      case 7:
        return <AirbnbStepTransition phase={2} />;
      case 8:
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
      case 9:
        return (
          <AmenitiesStep
            category="essentials"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 10:
        return (
          <AmenitiesStep
            category="shared"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 11:
        return (
          <AmenitiesStep
            category="safety"
            selectedAmenities={formData.amenities}
            onToggle={toggleAmenity}
          />
        );
      case 12:
        return (
          <PhotosStep
            coverImage={formData.coverImage}
            galleryImages={formData.galleryImages}
            onCoverChange={(v) => setFormData({ ...formData, coverImage: v })}
            onGalleryChange={(v) => setFormData({ ...formData, galleryImages: v })}
          />
        );
      case 13:
        return <AirbnbStepTransition phase={3} />;
      case 14:
        return (
          <CapacityStep
            value={formData.capacity}
            onChange={(v) => setFormData({ ...formData, capacity: v })}
            propertyType={formData.propertyType}
          />
        );
      case 15:
        return (
          <UploadMethodStep
            value={formData.uploadMethod}
            onChange={(v) => setFormData({ ...formData, uploadMethod: v })}
          />
        );
      case 16:
        if (formData.uploadMethod === 'excel') {
          return (
            <ExcelUploadStep
              roomCount={formData.capacity}
              onImport={(rooms) => setFormData({ ...formData, rooms, selectedRoomIds: rooms.map(r => r.id) })}
              importedCount={formData.rooms.length}
            />
          );
        }
        return (
          <RoomNamesStep
            rooms={formData.rooms}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 17:
        return (
          <RoomTypesStep
            rooms={formData.rooms}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 18:
        return (
          <RoomBulkSelectionStep
            rooms={formData.rooms}
            selectedIds={formData.selectedRoomIds}
            completedIds={formData.completedRoomIds}
            onSelectionChange={(ids) => setFormData({ ...formData, selectedRoomIds: ids })}
            title="Select rooms for pricing"
            subtitle="Choose which rooms to configure"
          />
        );
      case 19:
        return (
          <RoomPricingStep
            rooms={formData.rooms}
            selectedIds={formData.selectedRoomIds}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 20:
        return (
          <TieredPricingStep
            rooms={formData.rooms}
            selectedIds={formData.selectedRoomIds}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 21:
        return (
          <RoomAreaStep
            rooms={formData.rooms}
            selectedIds={formData.selectedRoomIds}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 22:
        return (
          <RoomCapacityStep
            rooms={formData.rooms}
            selectedIds={formData.selectedRoomIds}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 23:
        return (
          <RoomOccupancyStep
            rooms={formData.rooms}
            selectedIds={formData.selectedRoomIds}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 24:
        return (
          <RoomMediaStep
            rooms={formData.rooms}
            selectedIds={formData.selectedRoomIds}
            onChange={(rooms) => setFormData({ ...formData, rooms })}
          />
        );
      case 25:
        return (
          <ReviewStep
            formData={formData}
            onEditStep={setCurrentStep}
            agreedToOwnerTerms={agreedToOwnerTerms}
            onAgreedToOwnerTermsChange={setAgreedToOwnerTerms}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;
  const showFooter = currentStep > 0;
  const showTopBar = currentStep > 0;

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

      {/* Hidden preload video for step 1 */}
      {currentStep === 0 && (
        <video
          ref={step1VideoRef}
          src={Step1Video}
          preload="auto"
          muted
          playsInline
          style={{ display: 'none' }}
        />
      )}

      {/* Hidden preload video for step 2 */}
      {currentStep >= 1 && currentStep <= 6 && (
        <video
          ref={step2VideoRef}
          src={Step2Video}
          preload="auto"
          muted
          playsInline
          style={{ display: 'none' }}
        />
      )}

      {showFooter && (
        <WizardFooter
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          onBack={handleBack}
          onNext={isLastStep ? handleSubmit : handleNext}
          isNextDisabled={isNextDisabled()}
          isLastStep={isLastStep}
          isSubmitting={submitting || isSubmitting}
          isVideoPreloading={videoPreloading}
        />
      )}

      <ResponsiveAlertModal
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        title="Save & exit?"
        description="Your progress will be saved. You can continue where you left off anytime."
        confirmText="Save & exit"
        cancelText="Cancel"
        onConfirm={confirmExit}
        onCancel={() => setShowExitDialog(false)}
      />
    </div>
  );
}
