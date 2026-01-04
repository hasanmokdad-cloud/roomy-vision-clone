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
  governorate: string;
  district: string;
  town_village: string;
  university: string;
  major: string;
  year_of_study: number;
  accommodation_status: string;
  current_dorm_id: string;
  current_room_id: string;
  city: string;
  preferred_housing_area: string;
  budget: number;
  room_type: string;
  needs_roommate: boolean;
  enable_personality_matching: boolean;
  profile_photo_url: string;
  phone_number: string;
}

const INITIAL_DATA: WizardFormData = {
  full_name: '',
  age: 18,
  gender: '',
  governorate: '',
  district: '',
  town_village: '',
  university: '',
  major: '',
  year_of_study: 1,
  accommodation_status: 'need_dorm',
  current_dorm_id: '',
  current_room_id: '',
  city: '',
  preferred_housing_area: '',
  budget: 300,
  room_type: '',
  needs_roommate: false,
  enable_personality_matching: false,
  profile_photo_url: '',
  phone_number: ''
};

// Step flow (updated - accommodation comes before lifestyle):
// 0: Intro
// 1: Phase 1 Overview (About You)
// 2: Basic Info
// 3: Hometown
// 4: Academic
// 5: Phase 2 Overview (Accommodation)
// 6: Accommodation Status (Do you need a dorm?)
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

  const STORAGE_KEY = `roomy_student_onboarding_${user?.id}`;

  // Transition steps that auto-advance (not counted in progress)
  const TRANSITION_STEPS = [1, 5, 8];
  const isTransitionStep = TRANSITION_STEPS.includes(currentStep);

  // Calculate total FORM steps (excluding intro and transition steps)
  // Form steps: basic(2), hometown(3), academic(4), accommodation(6), extras(10), review(11) = 6 base
  // + housing prefs(7) if need_dorm
  // + personality(9) if enabled
  const getTotalSteps = () => {
    let total = 6; // Base form steps
    if (formData.accommodation_status === 'need_dorm') total += 1; // Housing prefs
    if (formData.enable_personality_matching) total += 1; // Personality matching
    return total;
  };

  // Map actual step number to display step (for progress bar)
  const getDisplayStep = () => {
    const hasHousingPrefs = formData.accommodation_status === 'need_dorm';
    const hasPersonality = formData.enable_personality_matching;
    
    switch (currentStep) {
      case 2: return 1;  // Basic Info
      case 3: return 2;  // Hometown
      case 4: return 3;  // Academic
      case 6: return 4;  // Accommodation Status
      case 7: return 5;  // Housing Preferences (only if need_dorm)
      case 9: return hasHousingPrefs ? 6 : 5;  // Personality Matching
      case 10: {
        // Profile Extras step number depends on what's enabled
        let step = 5;
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
        // Advance to next step
        setCurrentStep(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Load saved progress
  useEffect(() => {
    if (!user?.id) return;
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { step, data } = JSON.parse(saved);
        setCurrentStep(step);
        setFormData(prev => ({ ...prev, ...data }));
      } catch (e) {
        console.error('Failed to load saved progress:', e);
      }
    }
  }, [user?.id, STORAGE_KEY]);

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
    const totalSteps = getTotalSteps();
    
    if (currentStep === totalSteps) {
      await handleSubmit();
    } else {
      // Skip housing preferences step if have_dorm
      if (currentStep === 6 && formData.accommodation_status === 'have_dorm') {
        // Skip step 7 (housing preferences)
        // Also skip phase 3 overview (8) and personality matching (9) if not enabled
        if (!formData.enable_personality_matching) {
          setCurrentStep(10); // Skip to profile extras
        } else {
          setCurrentStep(8); // Go to phase 3 overview
        }
      } 
      // If need_dorm, after housing preferences (step 7), check if we should skip phase 3
      else if (currentStep === 7 && !formData.enable_personality_matching) {
        setCurrentStep(10); // Skip phase 3 overview (8) and personality matching (9)
      }
      // Skip personality matching step (9) if toggle is off (coming from phase 3 overview)
      else if (currentStep === 8 && !formData.enable_personality_matching) {
        setCurrentStep(10);
      }
      else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // Skip transition steps when going back
      // Step 2 -> skip 1 -> go to 0 (intro)
      if (currentStep === 2) {
        setCurrentStep(0);
      }
      // Step 6 -> skip 5 -> go to 4 (academic)
      else if (currentStep === 6) {
        setCurrentStep(4);
      }
      // When going back from profile extras (10) and personality matching is off
      else if (currentStep === 10 && !formData.enable_personality_matching) {
        if (formData.accommodation_status === 'have_dorm') {
          setCurrentStep(6); // Skip back to accommodation status (skip 7, 8, 9)
        } else {
          setCurrentStep(7); // Skip back to housing preferences (skip 8, 9)
        }
      }
      // When going back from personality matching (9), skip phase 3 overview (8)
      else if (currentStep === 9) {
        if (formData.accommodation_status === 'have_dorm') {
          setCurrentStep(6); // Skip back to accommodation status
        } else {
          setCurrentStep(7); // Skip back to housing preferences
        }
      }
      else {
        setCurrentStep(prev => prev - 1);
      }
    }
  };

  const handleEditFromReview = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    setIsSubmitting(true);
    try {
      // Get student record
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) {
        toast.error('Student record not found');
        return;
      }

      // Calculate profile completion score
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

      // Update student profile with all onboarding data
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          age: formData.age,
          gender: formData.gender,
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
          preferred_housing_area: formData.preferred_housing_area || null,
          needs_roommate_new_dorm: formData.needs_roommate,
          enable_personality_matching: formData.enable_personality_matching,
          profile_photo_url: formData.profile_photo_url || null,
          phone_number: formData.phone_number || null,
          onboarding_completed: true,
          room_confirmed: false,
          profile_completion_score: completionScore
        })
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
              // Don't fail the whole submission if room claim fails
            } else {
              console.log('Room change result:', changeRoomResult);
            }
          }
        } catch (claimError) {
          console.error('Error creating room claim via edge function:', claimError);
          // Don't fail the whole save if claim creation fails
        }
      }

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);
      
      // Mark onboarding as completed in sessionStorage
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
      case 2: // Basic Info
        return !!(formData.full_name.trim() && formData.gender);
      case 4: // Academic
        return !!formData.university;
      case 6: // Accommodation Status
        if (formData.accommodation_status === 'have_dorm') {
          return !!(formData.current_dorm_id && formData.current_room_id);
        }
        return !!formData.accommodation_status;
      case 7: // Housing Preferences (only shown if need_dorm)
        return formData.budget > 0 && !!formData.room_type && !!formData.city;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StudentAirbnbIntroStep onGetStarted={() => setCurrentStep(1)} />;
      case 1:
        return <StudentStepOverview phase={1} />;
      case 2:
        return (
          <BasicInfoStep
            data={{ full_name: formData.full_name, age: formData.age, gender: formData.gender }}
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
              needs_roommate: formData.needs_roommate,
              enable_personality_matching: formData.enable_personality_matching
            }}
            onChange={handleDataChange}
          />
        );
      case 7:
        // Housing preferences - only shown if need_dorm
        return (
          <HousingPreferencesStep
            data={{
              budget: formData.budget,
              room_type: formData.room_type,
              city: formData.city,
              preferred_housing_area: formData.preferred_housing_area,
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
    return (
      <div className="min-h-screen bg-background">
        <StudentWizardTopBar onSaveAndExit={handleSaveAndExit} />
        {renderStep()}
      </div>
    );
  }

  const totalSteps = getTotalSteps();
  const displayStep = getDisplayStep();

  return (
    <div className="min-h-screen bg-background">
      <StudentWizardTopBar onSaveAndExit={handleSaveAndExit} />
      {renderStep()}
      {!isTransitionStep && (
        <StudentWizardFooter
          currentStep={displayStep}
          totalSteps={totalSteps}
          onBack={handleBack}
          onNext={handleNext}
          isFirstStep={currentStep <= 1}
          isLastStep={currentStep === 11}
          canProceed={canProceed()}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

export default MobileStudentWizard;
