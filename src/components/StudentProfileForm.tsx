import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, MapPin, GraduationCap, DollarSign, Home, CheckCircle, ArrowRight, ArrowLeft, Users, Brain, Crown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Confetti } from '@/components/profile/Confetti';
import { ProfileProgress } from '@/components/profile/ProfileProgress';
import { residentialAreas, type Governorate, type District } from '@/data/residentialAreas';
import { universities } from '@/data/universities';
import { housingAreas } from '@/data/housingAreas';
import { roomTypes, isSingleRoom } from '@/data/roomTypes';

const studentProfileSchema = z.object({
  // Step 1 - Personal Info
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  age: z.number().min(16, 'Must be at least 16').max(100).optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  governorate: z.string().optional(),
  district: z.string().optional(),
  town_village: z.string().optional(),
  
  // Step 1 - Academic Info
  university: z.string().optional(),
  major: z.string().optional(),
  year_of_study: z.number().min(1).max(5).optional(),
  
  // Step 1 - Accommodation
  accommodation_status: z.enum(['need_dorm', 'have_dorm']).default('need_dorm'),
  needs_roommate_current_place: z.boolean().optional(),
  needs_roommate_new_dorm: z.boolean().optional(),
  enable_personality_matching: z.boolean().optional(),
  
  // Step 2 - Housing Preferences (only if need_dorm)
  budget: z.number().min(0).optional(),
  preferred_housing_area: z.string().optional(),
  room_type: z.string().optional(),
});

type StudentProfile = z.infer<typeof studentProfileSchema>;

interface StudentProfileFormProps {
  userId: string;
  onComplete?: () => void;
}

export const StudentProfileForm = ({ userId, onComplete }: StudentProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [accommodationStatus, setAccommodationStatus] = useState<'need_dorm' | 'have_dorm'>('need_dorm');
  const [needsRoommateCurrentPlace, setNeedsRoommateCurrentPlace] = useState(false);
  const [needsRoommateNewDorm, setNeedsRoommateNewDorm] = useState(false);
  const [enablePersonalityMatching, setEnablePersonalityMatching] = useState(false);
  const [personalityTestCompleted, setPersonalityTestCompleted] = useState(false);
  const [aiMatchPlan, setAiMatchPlan] = useState<string>("basic");
  
  // Hierarchical location state
  const [selectedGovernorate, setSelectedGovernorate] = useState<Governorate | ''>('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StudentProfile>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      accommodation_status: 'need_dorm'
    }
  });

  const formValues = watch();
  
  // Calculate profile completion percentage
  const calculateProgress = () => {
    let fields = ['full_name', 'age', 'gender', 'governorate', 'district', 'town_village', 'university', 'major', 'year_of_study'];
    
    if (accommodationStatus === 'need_dorm') {
      fields = [...fields, 'budget', 'preferred_housing_area', 'room_type'];
    }
    
    const filledFields = fields.filter(field => {
      const value = formValues[field as keyof StudentProfile];
      return value !== undefined && value !== null && value !== '';
    });
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const progress = calculateProgress();

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Handle governorate selection
  useEffect(() => {
    if (selectedGovernorate) {
      const districts = Object.keys(residentialAreas[selectedGovernorate]);
      setAvailableDistricts(districts);
      setSelectedDistrict('');
      setAvailableTowns([]);
      setValue('governorate', selectedGovernorate);
      setValue('district', '');
      setValue('town_village', '');
    }
  }, [selectedGovernorate]);

  // Handle district selection
  useEffect(() => {
    if (selectedGovernorate && selectedDistrict) {
      const towns = residentialAreas[selectedGovernorate][selectedDistrict as District<typeof selectedGovernorate>];
      setAvailableTowns(towns);
      setValue('district', selectedDistrict);
      setValue('town_village', '');
    }
  }, [selectedDistrict]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      setHasProfile(true);
      
      // Set accommodation status
      if (data.accommodation_status) {
        setAccommodationStatus(data.accommodation_status as 'need_dorm' | 'have_dorm');
        setValue('accommodation_status', data.accommodation_status as any);
      }
      
      // Set roommate needs
      if (data.needs_roommate_current_place !== undefined) {
        setNeedsRoommateCurrentPlace(data.needs_roommate_current_place);
        setValue('needs_roommate_current_place', data.needs_roommate_current_place);
      }
      if (data.needs_roommate_new_dorm !== undefined) {
        setNeedsRoommateNewDorm(data.needs_roommate_new_dorm);
        setValue('needs_roommate_new_dorm', data.needs_roommate_new_dorm);
      }
      
      // Set personality matching
      if (data.enable_personality_matching !== undefined) {
        setEnablePersonalityMatching(data.enable_personality_matching);
        setValue('enable_personality_matching', data.enable_personality_matching);
      }
      if (data.personality_test_completed !== undefined) {
        setPersonalityTestCompleted(data.personality_test_completed);
      }
      
      // Set AI match plan
      if (data.ai_match_plan) {
        setAiMatchPlan(data.ai_match_plan);
      }

      // Set location fields
      if (data.governorate) {
        setSelectedGovernorate(data.governorate as Governorate);
        setValue('governorate', data.governorate);
      }
      if (data.district) {
        setSelectedDistrict(data.district);
        setValue('district', data.district);
      }
      if (data.town_village) {
        setValue('town_village', data.town_village);
      }
      
      // Set other fields
      Object.keys(data).forEach((key) => {
        if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at' && key !== 'email') {
          const value = data[key];
          if (value !== null && value !== undefined) {
            setValue(key as keyof StudentProfile, value);
          }
        }
      });
    }
  };

  const handleStep1Complete = async (data: StudentProfile) => {
    if (accommodationStatus === 'have_dorm') {
      if (needsRoommateCurrentPlace) {
        // Save profile then navigate to roommate matching
        await saveProfile(data);
        navigate('/ai-match?mode=roommate');
      } else {
        // Just save profile
        await saveProfile(data);
      }
    } else {
      // Continue to Step 2
      setCurrentStep(2);
    }
  };

  const handleStep2Complete = async (data: StudentProfile) => {
    // Save profile first
    await saveProfile(data);
    
    if (needsRoommateNewDorm) {
      // Combined mode: both dorm and roommate matching
      navigate('/ai-match?mode=combined');
    } else {
      // Dorm-only mode
      navigate('/ai-match?mode=dorm');
    }
  };

  const saveProfile = async (data: StudentProfile) => {
    setLoading(true);
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {
        user_id: userId,
        email: user.email || '',
        full_name: data.full_name,
        age: data.age,
        gender: data.gender,
        governorate: data.governorate,
        district: data.district,
        town_village: data.town_village,
        university: data.university,
        major: data.major,
        year_of_study: data.year_of_study,
        accommodation_status: accommodationStatus,
        needs_roommate_current_place: needsRoommateCurrentPlace,
        needs_roommate_new_dorm: needsRoommateNewDorm,
        enable_personality_matching: enablePersonalityMatching,
        ai_match_plan: aiMatchPlan,
        profile_completion_score: calculateProgress(),
        updated_at: new Date().toISOString()
      };

      // Only include housing preferences if need_dorm
      if (accommodationStatus === 'need_dorm') {
        updateData.budget = data.budget;
        updateData.preferred_housing_area = data.preferred_housing_area;
        updateData.room_type = data.room_type;
      }

      const { error } = await supabase
        .from('students')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      toast({
        title: 'Profile saved! ✨',
        description: 'Your profile has been updated successfully.',
      });

      onComplete?.();
    } catch (error) {
      console.error('Profile save error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  const onSubmit = (data: StudentProfile) => {
    if (currentStep === 1) {
      handleStep1Complete(data);
    } else {
      handleStep2Complete(data);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showConfetti && <Confetti />}
      </AnimatePresence>

      <ProfileProgress percentage={progress} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg"
      >
        <div className="space-y-2 mb-6">
          <h2 className="text-3xl font-black text-primary">
            {currentStep === 1 ? 'Create Your Profile' : 'Set Your Preferences'}
          </h2>
          <p className="text-foreground/60">
            {currentStep === 1 
              ? 'Tell us about yourself to get started' 
              : 'Let us know your housing preferences'}
          </p>
          <div className="flex gap-2 mt-4">
            <div className={`h-2 flex-1 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 flex-1 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-black text-primary flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </h3>

                  <div>
                    <Label htmlFor="full_name" className="text-foreground/80">Full Name *</Label>
                    <Input
                      id="full_name"
                      {...register('full_name')}
                      placeholder="Your full name"
                      className="mt-2"
                    />
                    {errors.full_name && (
                      <p className="text-destructive text-sm mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age" className="text-foreground/80">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        {...register('age', { valueAsNumber: true })}
                        placeholder="Your age"
                        className="mt-2"
                      />
                      {errors.age && (
                        <p className="text-destructive text-sm mt-1">{errors.age.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="gender" className="text-foreground/80">Gender</Label>
                      <Select 
                        onValueChange={(value) => setValue('gender', value as any)}
                        value={formValues.gender}
                      >
                        <SelectTrigger id="gender" className="mt-2">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Hierarchical Location Selector */}
                  <div className="space-y-4">
                    <Label className="text-foreground/80">Residential Area</Label>
                    
                    <div>
                      <Label htmlFor="governorate" className="text-sm text-foreground/60">Governorate</Label>
                      <Select 
                        onValueChange={(value) => setSelectedGovernorate(value as Governorate)}
                        value={selectedGovernorate}
                      >
                        <SelectTrigger id="governorate" className="mt-1">
                          <SelectValue placeholder="Select governorate" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {Object.keys(residentialAreas).map((gov) => (
                            <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {availableDistricts.length > 0 && (
                      <div>
                        <Label htmlFor="district" className="text-sm text-foreground/60">District</Label>
                        <Select 
                          onValueChange={setSelectedDistrict}
                          value={selectedDistrict}
                        >
                          <SelectTrigger id="district" className="mt-1">
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50">
                            {availableDistricts.map((district) => (
                              <SelectItem key={district} value={district}>{district}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {availableTowns.length > 0 && (
                      <div>
                        <Label htmlFor="town_village" className="text-sm text-foreground/60">Area</Label>
                        <Select 
                          onValueChange={(value) => setValue('town_village', value)}
                          value={formValues.town_village}
                        >
                          <SelectTrigger id="town_village" className="mt-1">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent className="bg-background z-50 max-h-[300px]">
                            {availableTowns.map((town) => (
                              <SelectItem key={town} value={town}>{town}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Academic Information Section */}
                <div className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <h3 className="text-xl font-black text-primary flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Academic Information
                  </h3>

                  <div>
                    <Label htmlFor="university" className="text-foreground/80">University</Label>
                    <Select 
                      onValueChange={(value) => setValue('university', value)}
                      value={formValues.university}
                    >
                      <SelectTrigger id="university" className="mt-2">
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {universities.map((uni) => (
                          <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="major" className="text-foreground/80">Major</Label>
                    <Input
                      id="major"
                      {...register('major')}
                      placeholder="e.g., Computer Science"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="year_of_study" className="text-foreground/80">Year of Study</Label>
                    <Input
                      id="year_of_study"
                      type="number"
                      min="1"
                      max="5"
                      {...register('year_of_study', { valueAsNumber: true })}
                      placeholder="1-5"
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Accommodation Status Section */}
                <div className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <h3 className="text-xl font-black text-primary flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Accommodation Status
                  </h3>
                  
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold text-foreground">
                        Do you need a dorm?
                      </Label>
                      <p className="text-sm text-foreground/60">
                        Toggle based on your current situation
                      </p>
                    </div>
                    <Switch
                      checked={accommodationStatus === 'need_dorm'}
                      onCheckedChange={(checked) => {
                        setAccommodationStatus(checked ? 'need_dorm' : 'have_dorm');
                        setValue('accommodation_status', checked ? 'need_dorm' : 'have_dorm');
                      }}
                    />
                  </div>

                  {accommodationStatus === 'have_dorm' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-border"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Need a Roommate for Your Current Place?
                          </Label>
                          <p className="text-sm text-foreground/60">
                            Find compatible people to share your existing accommodation
                          </p>
                        </div>
                        <Switch
                          checked={needsRoommateCurrentPlace}
                          onCheckedChange={(checked) => {
                            setNeedsRoommateCurrentPlace(checked);
                            setValue('needs_roommate_current_place', checked);
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Personality Matching Section */}
                {accommodationStatus === 'have_dorm' && needsRoommateCurrentPlace && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-6"
                  >
                    <h3 className="text-xl font-black text-purple-600 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Personality Matching (Optional)
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Enable Personality Matching?</Label>
                        <p className="text-sm text-foreground/60">
                          Recommended for better roommate compatibility
                        </p>
                      </div>
                      <Switch 
                        checked={enablePersonalityMatching}
                        onCheckedChange={(checked) => {
                          setEnablePersonalityMatching(checked);
                          setValue('enable_personality_matching', checked);
                        }}
                      />
                    </div>
                    
                    {enablePersonalityMatching && !personalityTestCompleted && (
                      <Button 
                        type="button"
                        onClick={() => navigate('/personality')} 
                        variant="outline"
                        className="w-full"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Take Personality Test
                      </Button>
                    )}
                    
                    {enablePersonalityMatching && personalityTestCompleted && (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        ✔ Personality test completed – used for advanced matching
                      </Badge>
                    )}
                  </motion.div>
                )}

                {/* AI Match Plan Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6"
                >
                  <h3 className="text-xl font-black text-amber-600 flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    AI Match Plan (Preview Mode)
                  </h3>
                  <p className="text-sm text-foreground/60">
                    Choose your matching tier to unlock different features
                  </p>
                  
                  <RadioGroup value={aiMatchPlan} onValueChange={setAiMatchPlan}>
                    <div className="grid gap-4">
                      {/* Basic Plan */}
                      <div className="flex items-start space-x-3 p-4 border border-muted rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <RadioGroupItem value="basic" id="basic" className="mt-1" />
                        <Label htmlFor="basic" className="flex-1 cursor-pointer">
                          <span className="font-bold text-base">Basic Match — Free</span>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            <li>• 1 roommate match only</li>
                            <li>• No personality matching</li>
                            <li>• Random matches</li>
                          </ul>
                        </Label>
                      </div>
                      
                      {/* Advanced Plan */}
                      <div className="flex items-start space-x-3 p-4 border-2 border-blue-300 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
                        <RadioGroupItem value="advanced" id="advanced" className="mt-1" />
                        <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                          <span className="font-bold text-blue-600 text-base">Advanced Match — $4.99</span>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            <li>• Up to 3 matches</li>
                            <li>• Personality compatibility scores</li>
                            <li>• Premium chat features</li>
                          </ul>
                        </Label>
                      </div>
                      
                      {/* VIP Plan */}
                      <div className="flex items-start space-x-3 p-4 border-2 border-amber-300 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-colors cursor-pointer">
                        <RadioGroupItem value="vip" id="vip" className="mt-1" />
                        <Label htmlFor="vip" className="flex-1 cursor-pointer">
                          <span className="font-bold text-amber-600 text-base flex items-center gap-1">
                            <Crown className="w-4 h-4" />
                            VIP Match — $9.99
                          </span>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            <li>• Unlimited matches</li>
                            <li>• Priority roommate suggestions</li>
                            <li>• AI-guided onboarding</li>
                            <li>• Priority support</li>
                          </ul>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </motion.div>

                {/* Step 1 Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {accommodationStatus === 'have_dorm' && !needsRoommateCurrentPlace ? (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {loading ? 'Saving...' : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  ) : accommodationStatus === 'have_dorm' && needsRoommateCurrentPlace ? (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {loading ? 'Saving...' : (
                        <>
                          <Users className="w-4 h-4 mr-2" />
                          Find Roommate Matches
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      Continue to Step 2
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
                </Button>

                {/* Housing Preferences */}
                <div className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6">
                  <h3 className="text-xl font-black text-primary flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Housing Preferences
                  </h3>

                  <div>
                    <Label htmlFor="budget" className="text-foreground/80">Monthly Budget (USD)</Label>
                    <Input
                      id="budget"
                      type="number"
                      {...register('budget', { valueAsNumber: true })}
                      placeholder="e.g., 500"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferred_housing_area" className="text-foreground/80">Preferred Housing Area</Label>
                    <Select 
                      onValueChange={(value) => setValue('preferred_housing_area', value)}
                      value={formValues.preferred_housing_area}
                    >
                      <SelectTrigger id="preferred_housing_area" className="mt-2">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50 max-h-[300px]">
                        {housingAreas.map((area) => (
                          <SelectItem key={area} value={area}>{area}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="room_type" className="text-foreground/80">Preferred Room Type</Label>
                    <Select 
                      onValueChange={(value) => setValue('room_type', value)}
                      value={formValues.room_type}
                    >
                      <SelectTrigger id="room_type" className="mt-2">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50 max-h-[300px]">
                        {roomTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Roommate Toggle for Non-Single Rooms */}
                  {formValues.room_type && !isSingleRoom(formValues.room_type) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-border"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Need a Roommate?
                          </Label>
                          <p className="text-sm text-foreground/60">
                            We'll find students with matching preferences to share a dorm
                          </p>
                        </div>
                        <Switch
                          checked={needsRoommateNewDorm}
                          onCheckedChange={(checked) => {
                            setNeedsRoommateNewDorm(checked);
                            setValue('needs_roommate_new_dorm', checked);
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Personality Matching Section for Step 2 */}
                {needsRoommateNewDorm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-6"
                  >
                    <h3 className="text-xl font-black text-purple-600 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Personality Matching (Optional)
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-semibold">Enable Personality Matching?</Label>
                        <p className="text-sm text-foreground/60">
                          Recommended for better roommate compatibility
                        </p>
                      </div>
                      <Switch 
                        checked={enablePersonalityMatching}
                        onCheckedChange={(checked) => {
                          setEnablePersonalityMatching(checked);
                          setValue('enable_personality_matching', checked);
                        }}
                      />
                    </div>
                    
                    {enablePersonalityMatching && !personalityTestCompleted && (
                      <Button 
                        type="button"
                        onClick={() => navigate('/compatibility-test')} 
                        variant="outline"
                        className="w-full"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Take Compatibility Test
                      </Button>
                    )}
                    
                    {enablePersonalityMatching && personalityTestCompleted && (
                      <div className="flex items-center justify-between">
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          ✔ Compatibility test completed
                        </Badge>
                        <Button 
                          type="button"
                          onClick={() => navigate('/compatibility-test')} 
                          variant="ghost"
                          size="sm"
                        >
                          View / Retake Test
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 2 Action Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Saving...' : (
                    needsRoommateNewDorm ? (
                      <>
                        <Home className="w-4 h-4 mr-2" />
                        <Users className="w-4 h-4 mr-2" />
                        Find Matches
                      </>
                    ) : (
                      <>
                        <Home className="w-4 h-4 mr-2" />
                        Find Dorm Matches
                      </>
                    )
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </motion.div>
    </>
  );
};
