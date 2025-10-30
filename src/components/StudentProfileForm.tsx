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
  preferred_university: z.string().optional(),
  room_type: z.string().optional(),
  roommate_needed: z.boolean().optional(),
  budget: z.number().min(0).optional(),
  distance_preference: z.string().optional(),
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
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StudentProfile>({
    resolver: zodResolver(studentProfileSchema),
  });

  const formValues = watch();
  
  // Calculate profile completion percentage
  const calculateProgress = () => {
    const fields = ['full_name', 'age', 'gender', 'university', 'residential_area', 'preferred_university', 'room_type', 'budget'];
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
      Object.keys(data).forEach((key) => {
        if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && key !== 'updated_at' && key !== 'email') {
          setValue(key as keyof StudentProfile, data[key]);
        }
      });
    }
  };

  const onSubmit = async (data: StudentProfile) => {
    setLoading(true);
    setIsSaving(true);
    try {
      // Get user email from auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('students')
        .upsert({
          user_id: userId,
          email: user.email || '',
          full_name: data.full_name,
          age: data.age,
          gender: data.gender,
          university: data.university,
          residential_area: data.residential_area,
          preferred_university: data.preferred_university,
          room_type: data.room_type,
          roommate_needed: data.roommate_needed,
          budget: data.budget,
          distance_preference: data.distance_preference,
        }, {
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <ProfileProgress percentage={progress} />

        <div className="glass-hover neon-border rounded-3xl p-8">
          <div className="space-y-2 mb-6">
            <h2 className="text-3xl font-black gradient-text">
              {hasProfile ? 'Update Your Profile' : 'Complete Your Profile'}
            </h2>
            <p className="text-foreground/60">
              Help Roomy AI find dorms that match your needs perfectly
            </p>
          </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name *
            </Label>
            <Input
              {...register('full_name')}
              placeholder="Enter your full name"
              className="bg-black/20 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {errors.full_name && (
              <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age</Label>
              <Input
                type="number"
                {...register('age', { valueAsNumber: true })}
                placeholder="18"
                className="bg-black/20 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
              {errors.age && (
                <p className="text-xs text-red-400 mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <Label>Gender</Label>
              <Select onValueChange={(value) => setValue('gender', value as any)}>
                <SelectTrigger className="bg-black/20 border-white/10">
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

          <div>
            <Label className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              University
            </Label>
            <Select onValueChange={(value) => setValue('university', value)}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Select your university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LAU">Lebanese American University (LAU)</SelectItem>
                <SelectItem value="AUB">American University of Beirut (AUB)</SelectItem>
                <SelectItem value="USEK">Holy Spirit University of Kaslik (USEK)</SelectItem>
                <SelectItem value="NDU">Notre Dame University (NDU)</SelectItem>
                <SelectItem value="USJ">Université Saint-Joseph (USJ)</SelectItem>
                <SelectItem value="BAU">Beirut Arab University (BAU)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Current Area
              </Label>
              <Input
                {...register('residential_area')}
                placeholder="e.g., Beirut"
                className="bg-black/20 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Preferred Dorm Area
              </Label>
              <Input
                {...register('preferred_university')}
                placeholder="e.g., Near LAU"
                className="bg-black/20 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Monthly Budget ($)
              </Label>
              <Input
                type="number"
                {...register('budget', { valueAsNumber: true })}
                placeholder="500"
                className="bg-black/20 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Room Type
              </Label>
              <Select onValueChange={(value) => setValue('room_type', value)}>
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Room</SelectItem>
                  <SelectItem value="double">Double Room</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Distance Preference</Label>
            <Select onValueChange={(value) => setValue('distance_preference', value)}>
              <SelectTrigger className="bg-black/20 border-white/10">
                <SelectValue placeholder="Select distance preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walking">Walking Distance</SelectItem>
                <SelectItem value="shuttle">Shuttle Service OK</SelectItem>
                <SelectItem value="any">Any Distance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              {...register('roommate_needed')}
              className="w-4 h-4 rounded border-white/10 bg-black/20"
            />
            <Label className="cursor-pointer">Looking for a roommate</Label>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-6 rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] relative overflow-hidden group"
        >
          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.span
                key="saving"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving changes...
              </motion.span>
            ) : (
              <motion.span
                key="save"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {hasProfile ? 'Update Profile' : 'Complete Profile'}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-sm"
        >
          {progress === 100 ? (
            <>
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-primary font-semibold">All info up to date ✅</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-foreground/60">Pending completion ⚠️</span>
            </>
          )}
        </motion.div>
      </form>
        </div>
      </motion.div>
    </>
  );
};
