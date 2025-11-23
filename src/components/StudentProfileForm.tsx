import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, MapPin, GraduationCap, DollarSign, Home, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Confetti } from '@/components/profile/Confetti';
import { ProfileProgress } from '@/components/profile/ProfileProgress';

const studentProfileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  age: z.number().min(16, 'Must be at least 16').max(100).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  university: z.string().optional(),
  residential_area: z.string().optional(),
  accommodation_status: z.enum(['need_dorm', 'have_dorm']).default('need_dorm'),
  room_type: z.string().optional(),
  roommate_needed: z.boolean().optional(),
  budget: z.number().min(0).optional(),
  distance_preference: z.string().optional(),
  need_roommate: z.boolean().optional(),
  roommates_needed: z.number().min(0).max(10).optional(),
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
  const [accommodationStatus, setAccommodationStatus] = useState<'need_dorm' | 'have_dorm'>('need_dorm');
  const [needRoommate, setNeedRoommate] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StudentProfile>({
    resolver: zodResolver(studentProfileSchema),
  });

  const formValues = watch();
  
  // Calculate profile completion percentage
  const calculateProgress = () => {
    let fields = ['full_name', 'age', 'gender', 'university'];
    
    // Add conditional fields based on accommodation status
    if (accommodationStatus === 'need_dorm') {
      fields = [...fields, 'residential_area', 'room_type', 'budget', 'distance_preference'];
    } else if (accommodationStatus === 'have_dorm' && needRoommate) {
      fields = [...fields, 'roommates_needed'];
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

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      setHasProfile(true);
      
      // Set accommodation status state
      if (data.accommodation_status) {
        setAccommodationStatus(data.accommodation_status as 'need_dorm' | 'have_dorm');
      }
      
      // Set need roommate state
      if (data.need_roommate !== undefined) {
        setNeedRoommate(data.need_roommate);
      }
      
      Object.keys(data).forEach((key) => {
        if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at' && key !== 'email') {
          setValue(key as keyof StudentProfile, data[key]);
        }
      });
    }

    // Load AI responses to auto-fill if profile is incomplete
    if (!data || !data.budget) {
      const { data: aiResponses } = await supabase
        .from('students_ai_responses')
        .select('responses')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (aiResponses?.responses) {
        const responses = aiResponses.responses as Record<string, any>;
        if (responses.budget && !data?.budget) setValue('budget', responses.budget);
        if (responses.room_type && !data?.room_type) setValue('room_type', responses.room_type);
        if (responses[14] && !data?.age) setValue('age', parseInt(responses[14]));
        if (responses[15] && !data?.university) setValue('university', responses[15]);
      }
    }
  };

  const onSubmit = async (data: StudentProfile) => {
    setLoading(true);
    setIsSaving(true);
    try {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {
        user_id: userId,
        email: user.email || '',
        full_name: data.full_name,
        age: data.age,
        gender: data.gender,
        university: data.university,
        accommodation_status: accommodationStatus,
        profile_completion_score: calculateProgress(),
        updated_at: new Date().toISOString()
      };

      // Only include dorm-search fields if status is 'need_dorm'
      if (accommodationStatus === 'need_dorm') {
        updateData.residential_area = data.residential_area;
        updateData.room_type = data.room_type;
        updateData.roommate_needed = data.roommate_needed;
        updateData.budget = data.budget;
        updateData.distance_preference = data.distance_preference;
      }

      // Only include roommate fields if status is 'have_dorm'
      if (accommodationStatus === 'have_dorm') {
        updateData.need_roommate = needRoommate;
        updateData.roommates_needed = needRoommate ? data.roommates_needed : 0;
      }

      const { error } = await supabase
        .from('students')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Show confetti on successful save
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      toast({
        title: 'Profile saved! ✨',
        description: 'Your preferences will help Roomy AI find perfect matches.',
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
            {hasProfile ? 'Update Your Profile' : 'Complete Your Profile'}
          </h2>
          <p className="text-foreground/60">
            Help Roomy AI find dorms that match your needs perfectly
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                className="mt-2 w-full focus:ring-2 focus:ring-primary"
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
                  className="mt-2 w-full focus:ring-2 focus:ring-primary"
                />
                {errors.age && (
                  <p className="text-destructive text-sm mt-1">{errors.age.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="gender" className="text-foreground/80">Gender</Label>
                <Select onValueChange={(value) => setValue('gender', value as any)}>
                  <SelectTrigger id="gender" className="mt-2 w-full focus:ring-2 focus:ring-primary">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Academic Information Section */}
          <div className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-xl font-black text-primary flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Academic Information
            </h3>

            <div>
              <Label htmlFor="university" className="text-foreground/80">Current University</Label>
              <Input
                id="university"
                {...register('university')}
                placeholder="e.g., AUB, LAU, USJ"
                className="mt-2 w-full focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Accommodation Status Section */}
          <div className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h3 className="text-xl font-black text-primary flex items-center gap-2">
              <Home className="w-5 h-5" />
              Accommodation Status
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-semibold text-foreground">
                  Do you need a dorm?
                </Label>
                <p className="text-sm text-foreground/60">
                  Toggle based on your current accommodation status
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={accommodationStatus === 'have_dorm' ? 'font-bold text-primary' : 'text-foreground/60'}>
                  I Have a Dorm
                </span>
                <Switch
                  checked={accommodationStatus === 'need_dorm'}
                  onCheckedChange={(checked) => setAccommodationStatus(checked ? 'need_dorm' : 'have_dorm')}
                />
                <span className={accommodationStatus === 'need_dorm' ? 'font-bold text-primary' : 'text-foreground/60'}>
                  I Need a Dorm
                </span>
              </div>
            </div>
          </div>

          {/* Conditional: I Need a Dorm - Housing, Budget, Location */}
          {accommodationStatus === 'need_dorm' && (
            <>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6"
              >
                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Housing Preferences
                </h3>

                <div>
                  <Label htmlFor="residential_area" className="text-foreground/80">Preferred Residential Area</Label>
                  <Input
                    id="residential_area"
                    {...register('residential_area')}
                    placeholder="e.g., Hamra, Achrafieh, Jounieh"
                    className="mt-2 w-full focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room_type" className="text-foreground/80">Preferred Room Type</Label>
                    <Select onValueChange={(value) => setValue('room_type', value)}>
                      <SelectTrigger id="room_type" className="mt-2 w-full focus:ring-2 focus:ring-primary">
                        <SelectValue placeholder="Select room type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Double">Double</SelectItem>
                        <SelectItem value="Triple">Triple</SelectItem>
                        <SelectItem value="Suite">Suite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="roommate_needed" className="text-foreground/80">Need a Roommate?</Label>
                    <Select onValueChange={(value) => setValue('roommate_needed', value === 'yes')}>
                      <SelectTrigger id="roommate_needed" className="mt-2 w-full focus:ring-2 focus:ring-primary">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6"
              >
                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Budget
                </h3>

                <div>
                  <Label htmlFor="budget" className="text-foreground/80">Monthly Budget (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    {...register('budget', { valueAsNumber: true })}
                    placeholder="e.g., 500, 800, 1200"
                    className="mt-2 w-full focus:ring-2 focus:ring-primary"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-6"
              >
                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location Preferences
                </h3>

                <div>
                  <Label htmlFor="distance_preference" className="text-foreground/80">Preferred Distance from Campus</Label>
                  <Select onValueChange={(value) => setValue('distance_preference', value)}>
                    <SelectTrigger id="distance_preference" className="mt-2 w-full focus:ring-2 focus:ring-primary">
                      <SelectValue placeholder="Select distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Walking distance">Walking distance (&lt; 1 mile)</SelectItem>
                      <SelectItem value="Short commute">Short commute (1-3 miles)</SelectItem>
                      <SelectItem value="Moderate commute">Moderate commute (3-5 miles)</SelectItem>
                      <SelectItem value="Long commute">Long commute (&gt; 5 miles)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            </>
          )}

          {/* Conditional: I Have a Dorm - Roommate Section */}
          {accommodationStatus === 'have_dorm' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 bg-secondary/5 border border-secondary/20 rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-foreground">
                    Need a Roommate?
                  </Label>
                  <p className="text-sm text-foreground/60">
                    Looking for someone to share your dorm with?
                  </p>
                </div>
                <Switch
                  checked={needRoommate}
                  onCheckedChange={setNeedRoommate}
                />
              </div>
              
              <AnimatePresence>
                {needRoommate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="roommates_needed" className="text-foreground/80">
                      How many Roommates Do You Need?
                    </Label>
                    <Input
                      id="roommates_needed"
                      type="number"
                      min="1"
                      max="10"
                      {...register('roommates_needed', { valueAsNumber: true })}
                      placeholder="e.g., 1, 2, 3"
                      className="mt-2 w-full focus:ring-2 focus:ring-primary"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <Button 
            type="submit" 
            disabled={isSaving}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                {hasProfile ? 'Update Profile' : 'Create Profile'}
              </>
            )}
          </Button>

          {/* Profile Status Indicator */}
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
            {progress === 100 ? (
              <>
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">Profile Complete!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground/70">Complete your profile to get better AI matches</span>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </>
  );
};
