import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import StudentWizardTopBar from './StudentWizardTopBar';
import StudentWizardFooter from './StudentWizardFooter';
import StudentIntroStep from './steps/StudentIntroStep';
import StudentStepOverview from './steps/StudentStepOverview';
import BasicInfoStep from './steps/BasicInfoStep';
import HometownStep from './steps/HometownStep';
import AcademicStep from './steps/AcademicStep';
import LivingHabitsStep from './steps/LivingHabitsStep';
import SocialStyleStep from './steps/SocialStyleStep';
import CommutePrefsStep from './steps/CommutePrefsStep';
import BudgetStep from './steps/BudgetStep';
import AccommodationStatusStep from './steps/AccommodationStatusStep';
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
  personality_sleep_schedule: string;
  personality_noise_tolerance: string;
  personality_cleanliness_level: string;
  personality_intro_extro: string;
  personality_guests_frequency: string;
  personality_study_environment: string;
  preferred_housing_area: string;
  distance_preference: string;
  budget: number;
  room_type: string;
  accommodation_status: string;
  needs_roommate: boolean;
  enable_personality_matching: boolean;
  profile_photo_url: string;
  phone_number: string;
  bio: string;
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
  personality_sleep_schedule: '',
  personality_noise_tolerance: '',
  personality_cleanliness_level: '',
  personality_intro_extro: '',
  personality_guests_frequency: '',
  personality_study_environment: '',
  preferred_housing_area: '',
  distance_preference: '',
  budget: 300,
  room_type: '',
  accommodation_status: 'searching',
  needs_roommate: false,
  enable_personality_matching: false,
  profile_photo_url: '',
  phone_number: '',
  bio: ''
};

const TOTAL_STEPS = 13;

const MobileStudentWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const STORAGE_KEY = `roomy_student_onboarding_${user?.id}`;

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
    navigate('/listings');
  };

  const handleDataChange = (updates: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep === TOTAL_STEPS) {
      await handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
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

      // Update student profile with all onboarding data
      const { error } = await supabase
        .from('students')
        .update({
          full_name: formData.full_name,
          gender: formData.gender,
          university: formData.university,
          major: formData.major,
          budget: formData.budget,
          room_type: formData.room_type,
          accommodation_status: formData.accommodation_status,
          profile_photo_url: formData.profile_photo_url || null,
          phone_number: formData.phone_number || null,
          onboarding_completed: true
        })
        .eq('id', student.id);

      if (error) throw error;

      // Clear saved progress
      localStorage.removeItem(STORAGE_KEY);

      toast.success('Profile setup complete!');
      navigate('/listings');
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
      case 10: // Budget
        return formData.budget > 0 && !!formData.room_type;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <StudentIntroStep onGetStarted={() => setCurrentStep(1)} />;
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
          <LivingHabitsStep
            data={{
              personality_sleep_schedule: formData.personality_sleep_schedule,
              personality_noise_tolerance: formData.personality_noise_tolerance,
              personality_cleanliness_level: formData.personality_cleanliness_level
            }}
            onChange={handleDataChange}
          />
        );
      case 7:
        return (
          <SocialStyleStep
            data={{
              personality_intro_extro: formData.personality_intro_extro,
              personality_guests_frequency: formData.personality_guests_frequency,
              personality_study_environment: formData.personality_study_environment
            }}
            onChange={handleDataChange}
          />
        );
      case 8:
        return <StudentStepOverview phase={3} />;
      case 9:
        return (
          <CommutePrefsStep
            data={{ preferred_housing_area: formData.preferred_housing_area, distance_preference: formData.distance_preference }}
            onChange={handleDataChange}
          />
        );
      case 10:
        return (
          <BudgetStep
            data={{ budget: formData.budget, room_type: formData.room_type }}
            onChange={handleDataChange}
          />
        );
      case 11:
        return (
          <AccommodationStatusStep
            data={{
              accommodation_status: formData.accommodation_status,
              needs_roommate: formData.needs_roommate,
              enable_personality_matching: formData.enable_personality_matching
            }}
            onChange={handleDataChange}
          />
        );
      case 12:
        return (
          <ProfileExtrasStep
            data={{
              profile_photo_url: formData.profile_photo_url,
              phone_number: formData.phone_number,
              bio: formData.bio
            }}
            onChange={handleDataChange}
          />
        );
      case 13:
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

  return (
    <div className="min-h-screen bg-background">
      <StudentWizardTopBar onSaveAndExit={handleSaveAndExit} />
      {renderStep()}
      <StudentWizardFooter
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        onNext={handleNext}
        isFirstStep={currentStep <= 1}
        isLastStep={currentStep === TOTAL_STEPS}
        canProceed={canProceed()}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default MobileStudentWizard;
