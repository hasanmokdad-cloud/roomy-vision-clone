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
import { User, MapPin, GraduationCap, DollarSign, Home, CheckCircle, ArrowRight, ArrowLeft, Users, Brain, Phone, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Confetti } from '@/components/profile/Confetti';
import { ProfileProgress } from '@/components/profile/ProfileProgress';
import { PersonalitySurveyModal } from '@/components/profile/PersonalitySurveyModal';
import { ProfileFieldRow } from '@/components/profile/ProfileFieldRow';
import { ProfileFieldModal } from '@/components/profile/ProfileFieldModal';
import { ProfileSectionHeader } from '@/components/profile/ProfileSectionHeader';
import { residentialAreas, type Governorate, type District } from '@/data/residentialAreas';
import { universities } from '@/data/universities';
import { housingAreas } from '@/data/housingAreas';
import { roomTypes, isSingleRoom } from '@/data/roomTypes';

const studentProfileSchema = z.object({
  // Step 1 - Personal Info
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  age: z.number().min(16, 'Must be at least 16').max(100).optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  phone_number: z.string().optional(),
  governorate: z.string().optional(),
  district: z.string().optional(),
  town_village: z.string().optional(),
  
  // Step 1 - Academic Info
  university: z.string().optional(),
  major: z.string().optional(),
  year_of_study: z.number().min(1).max(6).optional(),
  
  // Personality matching toggle (survey is handled separately via PersonalitySurveyModal)
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

// Field types for the modal
type EditableField = 'full_name' | 'phone_number' | 'age' | 'gender' | 'location' | 'university' | 'major' | 'year_of_study' | 'budget' | 'preferred_housing_area' | 'room_type';

export const StudentProfileForm = ({ userId, onComplete }: StudentProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal state
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [accommodationStatus, setAccommodationStatus] = useState<'need_dorm' | 'have_dorm'>('need_dorm');
  const [needsRoommateCurrentPlace, setNeedsRoommateCurrentPlace] = useState(false);
  const [needsRoommateNewDorm, setNeedsRoommateNewDorm] = useState(false);
  const [enablePersonalityMatching, setEnablePersonalityMatching] = useState(false);
  const [personalityTestCompleted, setPersonalityTestCompleted] = useState(false);
  const [showPersonalitySurvey, setShowPersonalitySurvey] = useState(false);
  
  // Hierarchical location state
  const [selectedGovernorate, setSelectedGovernorate] = useState<Governorate | ''>('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  
  // Temp location state for modal
  const [tempGovernorate, setTempGovernorate] = useState<Governorate | ''>('');
  const [tempDistrict, setTempDistrict] = useState('');
  const [tempTown, setTempTown] = useState('');
  const [tempAvailableDistricts, setTempAvailableDistricts] = useState<string[]>([]);
  const [tempAvailableTowns, setTempAvailableTowns] = useState<string[]>([]);
  
  // Current dorm/room state (for have_dorm status)
  const [currentDormId, setCurrentDormId] = useState<string>('');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [availableDorms, setAvailableDorms] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [currentRoomData, setCurrentRoomData] = useState<any>(null);
  const [isRoomFull, setIsRoomFull] = useState(false);
  
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
    loadDorms();

    // Handle scroll-to from navigation state
    const scrollTo = (window.history.state?.usr as any)?.scrollTo;
    if (scrollTo === 'current-dorm-section') {
      setTimeout(() => {
        const element = document.getElementById('current-dorm-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [userId]);

  // Load available dorms for Current Dorm dropdown
  const loadDorms = async () => {
    const { data } = await supabase
      .from('dorms')
      .select('id, name, area')
      .eq('verification_status', 'Verified')
      .order('name');
    
    if (data) {
      setAvailableDorms(data);
    }
  };

  // Load rooms when current dorm is selected
  useEffect(() => {
    const loadRoomsForDorm = async () => {
      if (!currentDormId) {
        setAvailableRooms([]);
        setCurrentRoomData(null);
        setIsRoomFull(false);
        return;
      }

      let query = supabase
        .from('rooms')
        .select('id, name, type, capacity, capacity_occupied')
        .eq('dorm_id', currentDormId)
        .order('name');
      
      // CRITICAL: If seeking roommate for current place, only show multi-bed rooms (capacity > 1)
      if (needsRoommateCurrentPlace && accommodationStatus === 'have_dorm') {
        query = query.gt('capacity', 1);
      }

      const { data } = await query;
      
      if (data) {
        setAvailableRooms(data);
      }

      // Fetch current room data if room is selected
      if (currentRoomId) {
        const { data: roomData } = await supabase
          .from('rooms')
          .select('capacity, capacity_occupied')
          .eq('id', currentRoomId)
          .single();

        if (roomData) {
          setCurrentRoomData(roomData);
          setIsRoomFull(roomData.capacity_occupied >= roomData.capacity);
        }
      }
    };

    loadRoomsForDorm();
  }, [currentDormId, currentRoomId, needsRoommateCurrentPlace, accommodationStatus]);

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
  
  // Handle temp governorate selection in modal
  useEffect(() => {
    if (tempGovernorate) {
      const districts = Object.keys(residentialAreas[tempGovernorate]);
      setTempAvailableDistricts(districts);
      if (tempDistrict && !districts.includes(tempDistrict)) {
        setTempDistrict('');
        setTempAvailableTowns([]);
        setTempTown('');
      }
    }
  }, [tempGovernorate]);

  // Handle temp district selection in modal
  useEffect(() => {
    if (tempGovernorate && tempDistrict) {
      const govData = residentialAreas[tempGovernorate];
      const towns = (govData as Record<string, string[]>)[tempDistrict] || [];
      setTempAvailableTowns(towns);
      if (tempTown && !towns.includes(tempTown)) {
        setTempTown('');
      }
    }
  }, [tempDistrict, tempGovernorate]);

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
      
      // Set current dorm/room
      if (data.current_dorm_id) {
        setCurrentDormId(data.current_dorm_id);
      }
      if (data.current_room_id) {
        setCurrentRoomId(data.current_room_id);
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
        phone_number: data.phone_number || null,
        accommodation_status: accommodationStatus,
        needs_roommate_current_place: needsRoommateCurrentPlace,
        needs_roommate_new_dorm: needsRoommateNewDorm,
        enable_personality_matching: enablePersonalityMatching,
        current_dorm_id: currentDormId || null,
        current_room_id: currentRoomId || null,
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
      setIsSaving(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentRoomId) return;

    try {
      setLoading(true);

      // Decrement room occupancy
      const { error: rpcError } = await supabase.rpc('decrement_room_occupancy', {
        room_id: currentRoomId
      });

      if (rpcError) throw rpcError;

      // Clear student's current room
      const { error: updateError } = await supabase
        .from('students')
        .update({
          current_dorm_id: null,
          current_room_id: null,
          accommodation_status: 'need_dorm'
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Update local state
      setCurrentDormId('');
      setCurrentRoomId('');
      setCurrentRoomData(null);
      setIsRoomFull(false);
      setAccommodationStatus('need_dorm');

      toast({
        title: 'Room vacated',
        description: 'Your room has been freed up for other students.',
      });
    } catch (error) {
      console.error('Leave room error:', error);
      toast({
        title: 'Error',
        description: 'Failed to leave room. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: StudentProfile) => {
    if (currentStep === 1) {
      handleStep1Complete(data);
    } else {
      handleStep2Complete(data);
    }
  };
  
  // Open field edit modal
  const openFieldModal = (field: EditableField) => {
    setEditingField(field);
    
    if (field === 'location') {
      setTempGovernorate(selectedGovernorate);
      setTempDistrict(selectedDistrict);
      setTempTown(formValues.town_village || '');
      if (selectedGovernorate) {
        setTempAvailableDistricts(Object.keys(residentialAreas[selectedGovernorate]));
        if (selectedDistrict) {
          const towns = residentialAreas[selectedGovernorate][selectedDistrict as District<typeof selectedGovernorate>];
          setTempAvailableTowns(towns || []);
        }
      }
    } else {
      setTempValue(formValues[field as keyof StudentProfile] ?? '');
    }
  };
  
  // Save field from modal
  const saveFieldFromModal = () => {
    if (!editingField) return;
    
    if (editingField === 'location') {
      setSelectedGovernorate(tempGovernorate);
      setSelectedDistrict(tempDistrict);
      setValue('governorate', tempGovernorate);
      setValue('district', tempDistrict);
      setValue('town_village', tempTown);
      if (tempGovernorate) {
        setAvailableDistricts(Object.keys(residentialAreas[tempGovernorate]));
        if (tempDistrict) {
          const towns = residentialAreas[tempGovernorate][tempDistrict as District<typeof tempGovernorate>];
          setAvailableTowns(towns || []);
        }
      }
    } else if (editingField === 'age' || editingField === 'year_of_study' || editingField === 'budget') {
      setValue(editingField, tempValue ? Number(tempValue) : undefined);
    } else {
      setValue(editingField as keyof StudentProfile, tempValue);
    }
    
    setEditingField(null);
    setTempValue(null);
  };
  
  // Get location display value
  const getLocationDisplay = () => {
    const parts = [formValues.town_village, selectedDistrict, selectedGovernorate].filter(Boolean);
    return parts.join(', ') || null;
  };
  
  // Get year of study display
  const getYearDisplay = (year: number | undefined) => {
    if (!year) return null;
    const yearLabels: Record<number, string> = {
      1: 'Year 1 (Freshman)',
      2: 'Year 2 (Sophomore)',
      3: 'Year 3 (Junior)',
      4: 'Year 4 (Senior)',
      5: 'Year 5+',
      6: 'Graduate Student'
    };
    return yearLabels[year] || null;
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
        className="w-full px-4 md:px-6"
      >
        <div className="space-y-2 mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {currentStep === 1 ? 'Create Your Profile' : 'Set Your Preferences'}
          </h2>
          <p className="text-muted-foreground">
            {currentStep === 1 
              ? 'Tell us about yourself to get started' 
              : 'Let us know your housing preferences'}
          </p>
          <div className="flex gap-2 mt-4">
            <div className={`h-1 flex-1 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-0"
              >
                {/* Personal Information Section */}
                <ProfileSectionHeader icon={<User className="w-5 h-5" />} title="Personal Information" />
                
                <div className="divide-y divide-border">
                  <ProfileFieldRow
                    icon={<User className="w-5 h-5" />}
                    label="Full name"
                    value={formValues.full_name}
                    placeholder="Add your name"
                    onClick={() => openFieldModal('full_name')}
                    required
                  />
                  
                  <ProfileFieldRow
                    icon={<Phone className="w-5 h-5" />}
                    label="Phone number"
                    value={formValues.phone_number}
                    placeholder="Add phone number"
                    onClick={() => openFieldModal('phone_number')}
                  />
                  
                  <ProfileFieldRow
                    icon={<Calendar className="w-5 h-5" />}
                    label="Age"
                    value={formValues.age}
                    placeholder="Add your age"
                    onClick={() => openFieldModal('age')}
                  />
                  
                  <ProfileFieldRow
                    icon={<User className="w-5 h-5" />}
                    label="Gender"
                    value={formValues.gender}
                    placeholder="Select gender"
                    onClick={() => openFieldModal('gender')}
                  />
                  
                  <ProfileFieldRow
                    icon={<MapPin className="w-5 h-5" />}
                    label="Residential area"
                    value={getLocationDisplay()}
                    placeholder="Add your location"
                    onClick={() => openFieldModal('location')}
                  />
                </div>

                {/* Academic Information Section */}
                <ProfileSectionHeader icon={<GraduationCap className="w-5 h-5" />} title="Academic Information" className="mt-8" />
                
                <div className="divide-y divide-border">
                  <ProfileFieldRow
                    icon={<GraduationCap className="w-5 h-5" />}
                    label="University"
                    value={formValues.university}
                    placeholder="Select university"
                    onClick={() => openFieldModal('university')}
                  />
                  
                  <ProfileFieldRow
                    icon={<GraduationCap className="w-5 h-5" />}
                    label="Major"
                    value={formValues.major}
                    placeholder="Add your major"
                    onClick={() => openFieldModal('major')}
                  />
                  
                  <ProfileFieldRow
                    icon={<Calendar className="w-5 h-5" />}
                    label="Year of study"
                    value={getYearDisplay(formValues.year_of_study)}
                    placeholder="Select year"
                    onClick={() => openFieldModal('year_of_study')}
                  />
                </div>

                {/* Accommodation Status Section */}
                <ProfileSectionHeader icon={<Home className="w-5 h-5" />} title="Accommodation Status" className="mt-8" />
                
                <div className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <Label className="text-base font-medium text-foreground">
                        Do you need a dorm?
                      </Label>
                      <p className="text-sm text-muted-foreground">
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
                      className="pt-4 mt-4 border-t border-border"
                    >
                      
                      {/* Current Dorm Selection */}
                      <div id="current-dorm-section" className="space-y-4">
                        <Label className="text-base font-medium">Your Current Dorm</Label>
                        <p className="text-sm text-muted-foreground">Select your current accommodation</p>
                        
                        <div>
                          <Label htmlFor="current_dorm" className="text-sm text-muted-foreground">Dorm</Label>
                          <Select value={currentDormId || ""} onValueChange={setCurrentDormId}>
                            <SelectTrigger id="current_dorm" className="mt-1">
                              <SelectValue placeholder="Select your current dorm" />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {availableDorms.map((dorm) => (
                                <SelectItem key={dorm.id} value={dorm.id}>
                                  {dorm.name} - {dorm.area}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {currentDormId && (
                          <div>
                            <Label htmlFor="current_room" className="text-sm text-muted-foreground">Room</Label>
                            <Select value={currentRoomId || ""} onValueChange={(value) => {
                              setCurrentRoomId(value);
                              // Auto-reset roommate toggle if selecting a single room
                              const selectedRoom = availableRooms.find(r => r.id === value);
                              if (selectedRoom && (isSingleRoom(selectedRoom.type) || selectedRoom.capacity === 1)) {
                                setNeedsRoommateCurrentPlace(false);
                                setValue('needs_roommate_current_place', false);
                              }
                            }}>
                              <SelectTrigger id="current_room" className="mt-1">
                                <SelectValue placeholder="Select your current room" />
                              </SelectTrigger>
                              <SelectContent className="bg-background z-50">
                                {availableRooms.map((room) => (
                                  <SelectItem key={room.id} value={room.id}>
                                    {room.name} ({room.type}) - {room.capacity_occupied}/{room.capacity} occupied
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        
                        {/* Need a Roommate Toggle - only for multi-bed rooms */}
                        {currentRoomId && (() => {
                          const selectedRoom = availableRooms.find(r => r.id === currentRoomId);
                          const isRoomSingleOccupancy = selectedRoom 
                            ? (isSingleRoom(selectedRoom.type) || selectedRoom.capacity === 1) 
                            : true;
                          return !isRoomSingleOccupancy && !isRoomFull;
                        })() && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-between flex-wrap gap-4 p-4 bg-muted/50 rounded-lg"
                          >
                            <div className="space-y-1">
                              <Label className="text-base font-medium text-foreground flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Need a Roommate for Your Current Place?
                              </Label>
                              <p className="text-sm text-muted-foreground">
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
                          </motion.div>
                        )}
                        
                        {/* Leaving Your Room Toggle */}
                        {currentRoomId && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="flex items-center justify-between p-4 border-2 border-destructive/20 rounded-lg bg-destructive/5 mt-4"
                          >
                            <div>
                              <Label className="text-base font-medium text-destructive">Leaving Your Room?</Label>
                              <p className="text-sm text-muted-foreground">
                                This will free up your spot for other students and update your accommodation status
                              </p>
                            </div>
                            <Button 
                              type="button"
                              variant="destructive" 
                              onClick={handleLeaveRoom}
                              disabled={loading}
                            >
                              {loading ? 'Processing...' : 'Leave Room'}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Personality Matching Section - Only when needsRoommateCurrentPlace is true */}
                {accommodationStatus === 'have_dorm' && needsRoommateCurrentPlace && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="py-4 border-t border-border"
                  >
                    <ProfileSectionHeader icon={<Brain className="w-5 h-5" />} title="Personality Matching (Optional)" />
                    
                    <div className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Enable Personality Matching?</Label>
                        <p className="text-sm text-muted-foreground">
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

                {/* Step 1 Action Buttons */}
                <div className="flex gap-3 pt-6 mt-6 border-t border-border">
                  {accommodationStatus === 'have_dorm' && (!needsRoommateCurrentPlace || isRoomFull) ? (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Saving...' : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  ) : accommodationStatus === 'have_dorm' && needsRoommateCurrentPlace && !isRoomFull ? (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
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
                      className="flex-1"
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
                className="space-y-0"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="mb-4 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Profile
                </Button>

                {/* Housing Preferences */}
                <ProfileSectionHeader icon={<Home className="w-5 h-5" />} title="Housing Preferences" />
                
                <div className="divide-y divide-border">
                  <ProfileFieldRow
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Monthly budget (USD)"
                    value={formValues.budget ? `$${formValues.budget}` : null}
                    placeholder="Set your budget"
                    onClick={() => openFieldModal('budget')}
                  />
                  
                  <ProfileFieldRow
                    icon={<MapPin className="w-5 h-5" />}
                    label="Preferred housing area"
                    value={formValues.preferred_housing_area}
                    placeholder="Select area"
                    onClick={() => openFieldModal('preferred_housing_area')}
                  />
                  
                  <ProfileFieldRow
                    icon={<Home className="w-5 h-5" />}
                    label="Preferred room type"
                    value={formValues.room_type}
                    placeholder="Select room type"
                    onClick={() => openFieldModal('room_type')}
                  />
                </div>

                {/* Roommate Toggle for Non-Single Rooms */}
                {formValues.room_type && !isSingleRoom(formValues.room_type) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="py-4 border-t border-border mt-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Need a Roommate?
                        </Label>
                        <p className="text-sm text-muted-foreground">
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

                {/* Personality Matching Section for Step 2 - Only when needsRoommateNewDorm is true */}
                {needsRoommateNewDorm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="py-4 border-t border-border mt-4"
                  >
                    <ProfileSectionHeader icon={<Brain className="w-5 h-5" />} title="Personality Matching (Optional)" />
                    
                    <div className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Enable Personality Matching?</Label>
                        <p className="text-sm text-muted-foreground">
                          Recommended for better roommate compatibility
                        </p>
                      </div>
                      <Switch 
                        checked={enablePersonalityMatching}
                        onCheckedChange={(checked) => {
                          setEnablePersonalityMatching(checked);
                          setValue('enable_personality_matching', checked);
                          // Open survey modal when enabled and not completed
                          if (checked && !personalityTestCompleted) {
                            setShowPersonalitySurvey(true);
                          }
                        }}
                      />
                    </div>
                    
                    {enablePersonalityMatching && (
                      <Button 
                        type="button"
                        onClick={() => setShowPersonalitySurvey(true)}
                        variant="outline"
                        className="w-full"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        {personalityTestCompleted ? 'Edit Survey' : 'Take Survey'}
                      </Button>
                    )}
                    
                    {enablePersonalityMatching && personalityTestCompleted && (
                      <Badge className="bg-green-100 text-green-700 border-green-300 mt-3">
                        ✔ Personality survey completed
                      </Badge>
                    )}
                  </motion.div>
                )}

                {/* Step 2 Action Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6"
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
      
      {/* Field Edit Modals */}
      <ProfileFieldModal
        open={editingField === 'full_name'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Full name"
        description="This is the name that will be shown to other students and dorm owners."
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="Your full name"
          autoFocus
        />
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'phone_number'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Phone number"
        description="Your phone number will be used for important notifications."
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Input
          type="tel"
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="+961 XX XXX XXX"
          autoFocus
        />
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'age'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Age"
        description="Your age helps us match you with suitable accommodations."
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Input
          type="number"
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="Your age"
          min={16}
          max={100}
          autoFocus
        />
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'gender'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Gender"
        description="This helps match you with gender-appropriate dorms."
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'location'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Residential area"
        description="Where is your hometown located?"
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Governorate</Label>
            <Select value={tempGovernorate || ''} onValueChange={(val) => setTempGovernorate(val as Governorate)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select governorate" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {Object.keys(residentialAreas).map((gov) => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {tempAvailableDistricts.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground">District</Label>
              <Select value={tempDistrict || ''} onValueChange={setTempDistrict}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {tempAvailableDistricts.map((district) => (
                    <SelectItem key={district} value={district}>{district}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {tempAvailableTowns.length > 0 && (
            <div>
              <Label className="text-sm text-muted-foreground">Area</Label>
              <Select value={tempTown || ''} onValueChange={setTempTown}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select area" />
                </SelectTrigger>
                <SelectContent className="bg-background max-h-[200px]">
                  {tempAvailableTowns.map((town) => (
                    <SelectItem key={town} value={town}>{town}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'university'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="University"
        description="Which university are you attending?"
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select university" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            {universities.map((uni) => (
              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'major'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Major"
        description="What are you studying?"
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="e.g., Computer Science"
          autoFocus
        />
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'year_of_study'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Year of study"
        description="What year are you currently in?"
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Select value={tempValue?.toString() || ''} onValueChange={(val) => setTempValue(parseInt(val))}>
          <SelectTrigger>
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="1">Year 1 (Freshman)</SelectItem>
            <SelectItem value="2">Year 2 (Sophomore)</SelectItem>
            <SelectItem value="3">Year 3 (Junior)</SelectItem>
            <SelectItem value="4">Year 4 (Senior)</SelectItem>
            <SelectItem value="5">Year 5+</SelectItem>
            <SelectItem value="6">Graduate Student</SelectItem>
          </SelectContent>
        </Select>
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'budget'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Monthly budget"
        description="What's your maximum monthly budget for accommodation (in USD)?"
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Input
          type="number"
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="e.g., 500"
          min={0}
          autoFocus
        />
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'preferred_housing_area'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Preferred housing area"
        description="Where would you like to live?"
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select area" />
          </SelectTrigger>
          <SelectContent className="bg-background max-h-[300px]">
            {housingAreas.map((area) => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>
      
      <ProfileFieldModal
        open={editingField === 'room_type'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Preferred room type"
        description="What type of room are you looking for?"
        onSave={saveFieldFromModal}
        isSaving={isSaving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent className="bg-background max-h-[300px]">
            {roomTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>
      
      <PersonalitySurveyModal
        open={showPersonalitySurvey}
        onOpenChange={setShowPersonalitySurvey}
        userId={userId}
        onComplete={() => {
          setPersonalityTestCompleted(true);
          toast({
            title: "Survey Complete!",
            description: "Your personality preferences will help us find better roommate matches"
          });
        }}
      />
    </>
  );
};
