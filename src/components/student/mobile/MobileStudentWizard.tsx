import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { calculateProfileCompletion } from '@/utils/profileCompletion';
import StudentWizardTopBar from './StudentWizardTopBar';
import StudentWizardFooter from './StudentWizardFooter';
import { StudentAirbnbIntroStep } from './steps/StudentAirbnbIntroStep';
import StudentStepOverview from './steps/StudentStepOverview';
import BasicInfoStep from './steps/BasicInfoStep';
import HometownStep from './steps/HometownStep';
import AcademicStep from './steps/AcademicStep';
import PersonalityMatchingStep from './steps/PersonalityMatchingStep';
import AccommodationStatusStep from './steps/AccommodationStatusStep';
import HousingPreferencesStep from './steps/HousingPreferencesStep';
import ProfileExtrasStep from './steps/ProfileExtrasStep';
import StudentReviewStep from './steps/StudentReviewStep';

interface WizardFormData {
  full_name: string;
  age: number;
  gender: string;
  tenant_role: string;
  governorate: string;
  district: string;
  town_village: string;
  university: string;
  major: string;
  year_of_study: number;
  accommodation_status: string;
  current_dorm_id: string;
  current_room_id: string;
  current_apartment_id: string;
  current_bedroom_id: string;
  city: string;
  preferred_housing_area: string;
  budget: number;
  room_type: string;
  preferred_housing_type: string;
  preferred_apartment_type: string;
  needs_roommate: boolean;
  enable_personality_matching: boolean;
  profile_photo_url: string;
  phone_number: string;
}

const INITIAL_DATA: WizardFormData = {
  full_name: '',
  age: 18,
  gender: '',
  tenant_role: '',
  governorate: '',
  district: '',
  town_village: '',
  university: '',
  major: '',
  year_of_study: 1,
  accommodation_status: 'need_dorm',
  current_dorm_id: '',
  current_room_id: '',
  current_apartment_id: '',
  current_bedroom_id: '',
  city: '',
  preferred_housing_area: '',
  budget: 300,
  room_type: '',
  preferred_housing_type: '',
  preferred_apartment_type: '',
  needs_roommate: false,
  enable_personality_matching: false,
  profile_photo_url: '',
  phone_number: ''
};

// Step flow:
// 0: Intro
// 1: Phase 1 Overview (About You)
// 2: Basic Info
// 3: Hometown
// 4: Academic (skipped if non-student)
// 5: Phase 2 Overview (Accommodation)
// 6: Accommodation Status
// 7: Housing Preferences (only if need_dorm)
// 8: Phase 3 Overview (Lifestyle & Habits)
// 9: Personality Matching (opens survey modal)
// 10: Profile Extras
// 11: Review

interface MobileStudentWizardProps {
  isDrawerMode?: boolean;
  onComplete?: () => void;
}

const MobileStudentWizard = ({ isDrawerMode = false, onComplete }: MobileStudentWizardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  const STORAGE_KEY = `roomy_student_onboarding_${user?.id}`;
  const isNonStudent = formData.tenant_role === 'non_student';

  // Transition steps that auto-advance (not counted in progress)
  const TRANSITION_STEPS = [1, 5, 8];
  const isTransitionStep = TRANSITION_STEPS.includes(currentStep);

  const getTotalSteps = () => {
    let total = 6; // Base form steps: basic(2), hometown(3), academic(4), accommodation(6), extras(10), review(11)
    if (isNonStudent) total -= 1; // Skip academic
    if (formData.accommodation_status === 'need_dorm') total += 1; // Housing prefs
    if (formData.enable_personality_matching) total += 1; // Personality matching
    return total;
  };

  const getDisplayStep = () => {
    const hasHousingPrefs = formData.accommodation_status === 'need_dorm';
    const hasPersonality = formData.enable_personality_matching;
    
    switch (currentStep) {
      case 2: return 1;  // Basic Info
      case 3: return 2;  // Hometown
      case 4: return isNonStudent ? 0 : 3;  // Academic (hidden for non-student)
      case 6: return isNonStudent ? 3 : 4;  // Accommodation Status
      case 7: return isNonStudent ? 4 : 5;  // Housing Preferences
      case 9: {
        let step = isNonStudent ? 4 : 5;
        if (hasHousingPrefs) step++;
        return step;
      }
      case 10: {
        let step = isNonStudent ? 4 : 5;
        if (hasHousingPrefs) step++;
        if (hasPersonality) step++;
        return step;
      }
      case 11: return getTotalSteps(); // Review (always last)
      default: return 0;
    }
  };

  // Auto-advance transition steps after animation delay
  useEffect(() => {
    if (TRANSITION_STEPS.includes(currentStep)) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Check for saved progress on mount
  useEffect(() => {
    if (!user?.id) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setHasSavedProgress(true);
    }
  }, [user?.id, STORAGE_KEY]);

  const handleResume = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { step, data } = JSON.parse(saved);
        setCurrentStep(step);
        setFormData(prev => ({ ...prev, ...data }));
      } catch (e) {
        console.error('Failed to resume:', e);
      }
    }
  };

  const handleClearProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasSavedProgress(false);
  };

  // Save progress on changes
  useEffect(() => {
    if (!user?.id || currentStep === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      step: currentStep,
      data: formData,
      timestamp: Date.now()
    }));
  }, [currentStep, formData, user?.id, STORAGE_KEY]);

  const handleSaveAndExit = () => {
    toast.success('Progress saved! You can continue later.');
    if (isDrawerMode && onComplete) {
      onComplete();
    } else {
      navigate('/listings');
    }
  };

  const handleDataChange = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep === 11) {
      await handleSubmit();
      return;
    }

    // After hometown (3), skip academic (4) if non-student → go to phase 2 overview (5)
    if (currentStep === 3 && isNonStudent) {
      setCurrentStep(5); // Skip step 4 (academic), go to phase 2 overview
      return;
    }

    // Skip housing preferences step if have_dorm
    if (currentStep === 6 && formData.accommodation_status === 'have_dorm') {
      if (!formData.enable_personality_matching) {
        setCurrentStep(10); // Skip to profile extras
      } else {
        setCurrentStep(8); // Go to phase 3 overview
      }
      return;
    }

    // If need_dorm, after housing preferences (step 7), check if we should skip phase 3
    if (currentStep === 7 && !formData.enable_personality_matching) {
      setCurrentStep(10);
      return;
    }

    // Skip personality matching step (9) if toggle is off
    if (currentStep === 8 && !formData.enable_personality_matching) {
      setCurrentStep(10);
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep <= 0) return;

    // Step 2 -> skip 1 -> go to 0 (intro)
    if (currentStep === 2) {
      setCurrentStep(0);
      return;
    }

    // Step 5 (phase 2 overview) or step 6 -> go back to academic(4) or hometown(3) based on role
    if (currentStep === 6) {
      setCurrentStep(isNonStudent ? 3 : 4);
      return;
    }

    // When going back from profile extras (10) and personality matching is off
    if (currentStep === 10 && !formData.enable_personality_matching) {
      if (formData.accommodation_status === 'have_dorm') {
        setCurrentStep(6);
      } else {
        setCurrentStep(7);
      }
      return;
    }

    // When going back from personality matching (9), skip phase 3 overview (8)
    if (currentStep === 9) {
      if (formData.accommodation_status === 'have_dorm') {
        setCurrentStep(6);
      } else {
        setCurrentStep(7);
      }
      return;
    }

    setCurrentStep(prev => prev - 1);
  };

  const handleEditFromReview = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) {
        toast.error('Student record not found');
        return;
      }

      const completionScore = calculateProfileCompletion({
        full_name: formData.full_name,
        age: formData.age,
        gender: formData.gender,
        governorate: formData.governorate,
        university: formData.university,
        major: formData.major,
        year_of_study: formData.year_of_study,
        accommodation_status: formData.accommodation_status,
        current_dorm_id: formData.current_dorm_id,
        current_room_id: formData.current_room_id,
        budget: formData.budget,
        room_type: formData.room_type,
        city: formData.city,
        preferred_housing_area: formData.preferred_housing_area,
        profile_photo_url: formData.profile_photo_url,
        phone_number: formData.phone_number,
      });

      const updatePayload: Record<string, any> = {
        full_name: formData.full_name,
        age: formData.age,
        gender: formData.gender,
        tenant_role: formData.tenant_role || null,
        governorate: formData.governorate || null,
        district: formData.district || null,
        town_village: formData.town_village || null,
        university: formData.university,
        major: formData.major,
        year_of_study: formData.year_of_study,
        budget: formData.budget,
        room_type: formData.room_type,
        accommodation_status: formData.accommodation_status,
        current_dorm_id: formData.current_dorm_id || null,
        current_room_id: formData.current_room_id || null,
        current_apartment_id: formData.current_apartment_id || null,
        current_bedroom_id: formData.current_bedroom_id || null,
        preferred_housing_area: formData.preferred_housing_area || null,
        preferred_housing_type: formData.preferred_housing_type || null,
        preferred_apartment_type: formData.preferred_apartment_type || null,
        needs_roommate_new_dorm: formData.needs_roommate,
        enable_personality_matching: formData.enable_personality_matching,
        profile_photo_url: formData.profile_photo_url || null,
        phone_number: formData.phone_number || null,
        onboarding_completed: true,
        room_confirmed: false,
        profile_completion_score: completionScore
      };

      const { error } = await supabase
        .from('students')
        .update(updatePayload)
        .eq('id', student.id);

      if (error) throw error;

      // Create room occupancy claim via edge function if student selected a room
      if (formData.accommodation_status === 'have_dorm' && formData.current_dorm_id && formData.current_room_id) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          
          if (accessToken) {
            const { data: changeRoomResult, error: changeRoomError } = await supabase.functions.invoke('student-change-room', {
              body: {
                newRoomId: formData.current_room_id,
                newDormId: formData.current_dorm_id
              }
            });

            if (changeRoomError) {
              console.error('Error calling student-change-room:', changeRoomError);
            } else {
              console.log('Room change result:', changeRoomResult);
            }
          }
        } catch (claimError) {
          console.error('Error creating room claim via edge function:', claimError);
        }
      }

      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.setItem(`roomy_onboarding_${user.id}`, 'completed');

      toast.success('Profile setup complete!');
      
      if (isDrawerMode && onComplete) {
        onComplete();
      } else {
        navigate('/listings');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 2: // Basic Info - now requires tenant_role
        return !!(formData.full_name.trim() && formData.gender && formData.tenant_role);
      case 4: // Academic
        return !!formData.university;
      case 6: // Accommodation Status
        if (formData.accommodation_status === 'have_dorm') {
          return !!(formData.current_dorm_id && (formData.current_room_id || formData.current_apartment_id));
        }
        return !!formData.accommodation_status;
      case 7: // Housing Preferences
        return formData.budget > 0 && !!formData.city && !!(formData.room_type || formData.preferred_apartment_type);
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StudentAirbnbIntroStep 
            onGetStarted={() => {
              handleClearProgress();
              setCurrentStep(1);
            }}
            hasSavedProgress={hasSavedProgress}
            onResume={handleResume}
          />
        );
      case 1:
        return <StudentStepOverview phase={1} />;
      case 2:
        return (
          <BasicInfoStep
            data={{ full_name: formData.full_name, age: formData.age, gender: formData.gender, tenant_role: formData.tenant_role }}
            onChange={handleDataChange}
          />
        );
      case 3:
        return (
          <HometownStep
            data={{ governorate: formData.governorate, district: formData.district, town_village: formData.town_village }}
            onChange={handleDataChange}
          />
        );
      case 4:
        return (
          <AcademicStep
            data={{ university: formData.university, major: formData.major, year_of_study: formData.year_of_study }}
            onChange={handleDataChange}
          />
        );
      case 5:
        return <StudentStepOverview phase={2} />;
      case 6:
        return (
          <AccommodationStatusStep
            data={{
              accommodation_status: formData.accommodation_status,
              current_dorm_id: formData.current_dorm_id,
              current_room_id: formData.current_room_id,
              current_apartment_id: formData.current_apartment_id,
              current_bedroom_id: formData.current_bedroom_id,
              needs_roommate: formData.needs_roommate,
              enable_personality_matching: formData.enable_personality_matching
            }}
            onChange={handleDataChange}
          />
        );
      case 7:
        return (
          <HousingPreferencesStep
            data={{
              budget: formData.budget,
              room_type: formData.room_type,
              city: formData.city,
              preferred_housing_area: formData.preferred_housing_area,
              preferred_housing_type: formData.preferred_housing_type,
              preferred_apartment_type: formData.preferred_apartment_type,
              needs_roommate: formData.needs_roommate,
              enable_personality_matching: formData.enable_personality_matching
            }}
            onChange={handleDataChange}
          />
        );
      case 8:
        return <StudentStepOverview phase={3} />;
      case 9:
        return <PersonalityMatchingStep />;
      case 10:
        return (
          <ProfileExtrasStep
            data={{
              profile_photo_url: formData.profile_photo_url,
              phone_number: formData.phone_number
            }}
            onChange={handleDataChange}
            userId={user?.id || ''}
            userInitial={formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
          />
        );
      case 11:
        return <StudentReviewStep data={formData} onEdit={handleEditFromReview} />;
      default:
        return null;
    }
  };

  // Intro step has its own layout
  if (currentStep === 0) {
    return renderStep();
  }

  const totalSteps = getTotalSteps();

  return (
    <div className="min-h-screen bg-white">
      <StudentWizardTopBar onSaveAndExit={handleSaveAndExit} />
      {renderStep()}
      {!isTransitionStep && (
        <StudentWizardFooter
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          isNextDisabled={!canProceed()}
          isLastStep={currentStep === 11}
          isSubmitting={isSubmitting}
          hasHousingPrefs={formData.accommodation_status === 'need_dorm'}
          hasPersonality={formData.enable_personality_matching}
        />
      )}
    </div>
  );
};

export default MobileStudentWizard;
