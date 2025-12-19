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
import { Checkbox } from '@/components/ui/checkbox';
import { User, MapPin, GraduationCap, DollarSign, Home, Users, Brain, Calendar, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Confetti } from '@/components/profile/Confetti';

import { PersonalitySurveyModal } from '@/components/profile/PersonalitySurveyModal';
import { ProfileFieldRow } from '@/components/profile/ProfileFieldRow';
import { ProfileFieldModal } from '@/components/profile/ProfileFieldModal';
import { ProfileSectionHeader } from '@/components/profile/ProfileSectionHeader';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { residentialAreas, type Governorate, type District } from '@/data/residentialAreas';
import { universities } from '@/data/universities';

import { roomTypes, isSingleRoom } from '@/data/roomTypes';

const studentProfileSchema = z.object({
  // Personal Info
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  age: z.number().min(16, 'Must be at least 16').max(100).optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  
  governorate: z.string().optional(),
  district: z.string().optional(),
  town_village: z.string().optional(),
  
  // Academic Info
  university: z.string().optional(),
  major: z.string().optional(),
  year_of_study: z.number().min(1).max(6).optional(),
  
  // Accommodation
  accommodation_status: z.enum(['need_dorm', 'have_dorm']).default('need_dorm'),
  needs_roommate_current_place: z.boolean().optional(),
  needs_roommate_new_dorm: z.boolean().optional(),
  enable_personality_matching: z.boolean().optional(),
  
  // Housing Preferences (only if need_dorm)
  budget: z.number().min(0).optional(),
  preferred_city: z.enum(['Byblos', 'Beirut']).optional(),
  preferred_areas: z.array(z.string()).optional(),
  room_type: z.string().optional(),
});

type StudentProfile = z.infer<typeof studentProfileSchema>;

interface StudentProfileFormProps {
  userId: string;
  onComplete?: () => void;
}

// Field types for the modal
type EditableField = 'full_name' | 'age' | 'gender' | 'location' | 'university' | 'major' | 'year_of_study' | 'budget' | 'preferred_location' | 'room_type';

export const StudentProfileForm = ({ userId, onComplete }: StudentProfileFormProps) => {
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  // Modal state
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);
  
  // Accommodation state
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
  
  // Housing area state
  const [selectedCity, setSelectedCity] = useState<'Byblos' | 'Beirut' | ''>('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [tempAreas, setTempAreas] = useState<string[]>([]);
  
  // Area data by city
  const byblosAreas = ['Blat', 'Nahr Ibrahim', 'Halat', 'Jeddayel', 'Mastita', 'Fidar', 'Habboub'];
  const beirutAreas = ['Hamra', 'Manara', 'Ain El Mraisseh', 'Raoucheh', 'Ras Beirut', 'UNESCO', 
    'Geitawi', 'Dora', 'Badaro', 'Ashrafieh', 'Verdun', 'Sin El Fil', 'Dekwaneh', 'Jdeideh', 
    'Mar Elias', 'Borj Hammoud', 'Hazmieh', 'Furn El Chebbak', 'Tayouneh', 'Jnah', 
    "Ras Al Naba'a", 'Gemmayze', 'Clemenceau', 'Khalde'];
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<StudentProfile>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      accommodation_status: 'need_dorm'
    }
  });

  const formValues = watch();

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
      
      // Set profile photo
      if (data.profile_photo_url) {
        setProfilePhotoUrl(data.profile_photo_url);
      }
      
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
      
      // Set housing area preferences
      if (data.preferred_city) {
        setSelectedCity(data.preferred_city as 'Byblos' | 'Beirut');
      }
      if (data.preferred_areas && Array.isArray(data.preferred_areas)) {
        setSelectedAreas(data.preferred_areas);
        setValue('preferred_areas', data.preferred_areas);
      }

      // Set all other form values
      Object.keys(data).forEach((key) => {
        if (key in studentProfileSchema.shape && data[key] !== null) {
          setValue(key as any, data[key]);
        }
      });
    }
  };

  const openFieldModal = (field: EditableField) => {
    setEditingField(field);
    
    // Initialize temp values based on field
    if (field === 'location') {
      setTempGovernorate(selectedGovernorate);
      setTempDistrict(selectedDistrict);
      setTempTown(formValues.town_village || '');
    } else if (field === 'preferred_location') {
      setTempValue(selectedCity);
      setTempAreas([...selectedAreas]);
    } else {
      setTempValue(formValues[field as keyof StudentProfile]);
    }
  };

  const saveFieldValue = async () => {
    if (!editingField) return;
    
    setIsSaving(true);
    
    try {
      let updateData: any = {};
      
      if (editingField === 'location') {
        updateData = {
          governorate: tempGovernorate || null,
          district: tempDistrict || null,
          town_village: tempTown || null,
        };
        
        setSelectedGovernorate(tempGovernorate);
        setSelectedDistrict(tempDistrict);
        setValue('governorate', tempGovernorate || undefined);
        setValue('district', tempDistrict || undefined);
        setValue('town_village', tempTown || undefined);
      } else if (editingField === 'preferred_location') {
        // Save both city and areas together
        updateData = { 
          preferred_city: tempValue || null,
          preferred_areas: tempAreas 
        };
        setSelectedCity(tempValue as 'Byblos' | 'Beirut' | '');
        setSelectedAreas(tempAreas);
        setValue('preferred_city', tempValue || undefined);
        setValue('preferred_areas', tempAreas);
      } else {
        updateData = { [editingField]: tempValue };
        setValue(editingField as keyof StudentProfile, tempValue);
      }
      
      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      
      setEditingField(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: StudentProfile) => {
    setLoading(true);

    try {
      const profileData: any = {
        user_id: userId,
        full_name: data.full_name,
        age: data.age || null,
        gender: data.gender || null,
        
        governorate: selectedGovernorate || null,
        district: selectedDistrict || null,
        town_village: data.town_village || null,
        university: data.university || null,
        major: data.major || null,
        year_of_study: data.year_of_study || null,
        accommodation_status: accommodationStatus,
        needs_roommate_current_place: needsRoommateCurrentPlace,
        needs_roommate_new_dorm: needsRoommateNewDorm,
        enable_personality_matching: enablePersonalityMatching,
        current_dorm_id: currentDormId || null,
        current_room_id: currentRoomId || null,
      };

      // Add housing preferences only if need_dorm
      if (accommodationStatus === 'need_dorm') {
        profileData.budget = data.budget || null;
        profileData.preferred_city = selectedCity || null;
        profileData.preferred_areas = selectedAreas.length > 0 ? selectedAreas : null;
        profileData.room_type = data.room_type || null;
      }

      if (hasProfile) {
        const { error } = await supabase
          .from('students')
          .update(profileData)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('students')
          .insert([profileData]);

        if (error) throw error;
        setHasProfile(true);
      }

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      toast({
        title: 'Success!',
        description: 'Your profile has been saved successfully.',
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccommodationStatusChange = async (newStatus: 'need_dorm' | 'have_dorm') => {
    setAccommodationStatus(newStatus);
    setValue('accommodation_status', newStatus);
    
    // Reset roommate preferences when switching
    if (newStatus === 'need_dorm') {
      setNeedsRoommateCurrentPlace(false);
      setValue('needs_roommate_current_place', false);
    } else {
      setNeedsRoommateNewDorm(false);
      setValue('needs_roommate_new_dorm', false);
    }
    
    // Save to database if profile exists
    if (hasProfile) {
      const updateData: any = {
        accommodation_status: newStatus,
      };
      
      if (newStatus === 'need_dorm') {
        updateData.needs_roommate_current_place = false;
      } else {
        updateData.needs_roommate_new_dorm = false;
      }
      
      await supabase
        .from('students')
        .update(updateData)
        .eq('user_id', userId);
    }
  };

  const handleRoommateToggle = async (type: 'current' | 'new', value: boolean) => {
    if (type === 'current') {
      setNeedsRoommateCurrentPlace(value);
      setValue('needs_roommate_current_place', value);
      
      // If turning off roommate search, also turn off personality matching
      if (!value) {
        setEnablePersonalityMatching(false);
        setValue('enable_personality_matching', false);
      }
      
      // Clear current room if toggling on (to force re-selection of multi-bed room)
      if (value) {
        setCurrentRoomId('');
      }
    } else {
      setNeedsRoommateNewDorm(value);
      setValue('needs_roommate_new_dorm', value);
      
      // If turning off roommate search, also turn off personality matching
      if (!value) {
        setEnablePersonalityMatching(false);
        setValue('enable_personality_matching', false);
      }
    }
    
    // Save to database if profile exists
    if (hasProfile) {
      const updateData: any = {
        [type === 'current' ? 'needs_roommate_current_place' : 'needs_roommate_new_dorm']: value,
      };
      
      if (!value) {
        updateData.enable_personality_matching = false;
      }
      
      await supabase
        .from('students')
        .update(updateData)
        .eq('user_id', userId);
    }
  };

  const handlePersonalityMatchingToggle = async (value: boolean) => {
    if (value && !personalityTestCompleted) {
      setShowPersonalitySurvey(true);
      return;
    }
    
    setEnablePersonalityMatching(value);
    setValue('enable_personality_matching', value);
    
    if (hasProfile) {
      await supabase
        .from('students')
        .update({ enable_personality_matching: value })
        .eq('user_id', userId);
    }
  };

  const handlePersonalitySurveyComplete = async (answers: Record<string, number>) => {
    try {
      // Calculate personality scores
      const scores = {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
      };

      // Simple scoring logic (you can make this more sophisticated)
      Object.entries(answers).forEach(([question, answer]) => {
        const questionNum = parseInt(question.replace('q', ''));
        
        if (questionNum <= 2) scores.openness += answer;
        else if (questionNum <= 4) scores.conscientiousness += answer;
        else if (questionNum <= 6) scores.extraversion += answer;
        else if (questionNum <= 8) scores.agreeableness += answer;
        else scores.neuroticism += answer;
      });

      // Normalize scores (0-100)
      Object.keys(scores).forEach((key) => {
        scores[key as keyof typeof scores] = Math.round((scores[key as keyof typeof scores] / 10) * 100);
      });

      // Save to database
      await supabase
        .from('students')
        .update({
          personality_scores: scores,
          personality_test_completed: true,
          enable_personality_matching: true,
        })
        .eq('user_id', userId);

      setPersonalityTestCompleted(true);
      setEnablePersonalityMatching(true);
      setValue('enable_personality_matching', true);
      setShowPersonalitySurvey(false);

      toast({
        title: 'Success!',
        description: 'Personality test completed. Matching enabled!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCurrentDormChange = async (dormId: string) => {
    setCurrentDormId(dormId);
    setCurrentRoomId(''); // Reset room when dorm changes
    
    if (hasProfile) {
      await supabase
        .from('students')
        .update({ 
          current_dorm_id: dormId || null,
          current_room_id: null 
        })
        .eq('user_id', userId);
    }
  };

  const handleCurrentRoomChange = async (roomId: string) => {
    setCurrentRoomId(roomId);
    
    if (hasProfile) {
      await supabase
        .from('students')
        .update({ current_room_id: roomId || null })
        .eq('user_id', userId);
    }
  };

  const handleCityChange = async (city: 'Byblos' | 'Beirut') => {
    setSelectedCity(city);
    setSelectedAreas([]); // Reset areas when city changes
    setValue('preferred_city', city);
    setValue('preferred_areas', []);
    
    if (hasProfile) {
      await supabase
        .from('students')
        .update({ 
          preferred_city: city,
          preferred_areas: []
        })
        .eq('user_id', userId);
    }
  };

  const toggleArea = (area: string) => {
    setTempAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleAreaSelect = async (area: string) => {
    const newAreas = [area];
    setSelectedAreas(newAreas);
    setValue('preferred_areas', newAreas);
    
    if (hasProfile) {
      await supabase
        .from('students')
        .update({ preferred_areas: newAreas })
        .eq('user_id', userId);
    }
  };

  const getLocationDisplay = () => {
    const parts = [];
    if (formValues.town_village) parts.push(formValues.town_village);
    if (selectedDistrict) parts.push(selectedDistrict);
    if (selectedGovernorate) parts.push(selectedGovernorate);
    return parts.join(', ') || undefined;
  };

  const getAreasDisplay = () => {
    if (selectedAreas.length === 0) return undefined;
    if (selectedAreas.length <= 2) return selectedAreas.join(', ');
    return `${selectedAreas.slice(0, 2).join(', ')} +${selectedAreas.length - 2}`;
  };

  const shouldShowPersonalityMatching = (() => {
    if (accommodationStatus === 'need_dorm' && needsRoommateNewDorm) {
      return true;
    }
    
    if (accommodationStatus === 'have_dorm' && needsRoommateCurrentPlace) {
      // Must have a room selected AND room must not be single-occupancy
      if (!currentRoomId) return false;
      const selectedRoom = availableRooms.find(r => r.id === currentRoomId);
      if (!selectedRoom) return false;
      return !isSingleRoom(selectedRoom.type) && selectedRoom.capacity > 1;
    }
    
    return false;
  })();

  const getActionButtonText = () => {
    if (loading) return 'Saving...';
    if (!hasProfile) return 'Create Profile';
    
    if (accommodationStatus === 'need_dorm') {
      return needsRoommateNewDorm ? 'Find Roommate Matches' : 'Find Dorm Matches';
    }
    
    if (accommodationStatus === 'have_dorm' && needsRoommateCurrentPlace) {
      return 'Find Roommate Matches';
    }
    
    return 'Save Changes';
  };

  return (
    <div className="min-h-screen bg-background">
      {showConfetti && <Confetti />}
      
      <form onSubmit={handleSubmit(onSubmit)} className="pb-24">
        {/* Airbnb-style layout: Photo on left (~30%), form on right (~70%) */}
        <div className="grid lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr] min-h-screen">
          {/* Left side - Photo (sticky on desktop) */}
          <div className="lg:sticky lg:top-0 lg:h-screen p-6 lg:p-8 xl:p-12 flex items-start lg:items-center justify-center pt-8 lg:pt-0">
            <div className="w-full max-w-[280px]">
              <ProfilePhotoUpload
                userId={userId}
                currentUrl={profilePhotoUrl}
                onUploaded={setProfilePhotoUrl}
              />
            </div>
          </div>

          {/* Right side - Form fields */}
          <div className="p-6 lg:p-8 xl:p-12 space-y-8">
            {/* My Profile Header */}
            <div className="pb-2">
              <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">My profile</h1>
              <p className="text-muted-foreground mt-2 text-sm lg:text-base">
                Complete your profile to find the best matches
              </p>
            </div>

            {/* Personal Information */}
            <div>
              <ProfileSectionHeader
                icon={<User className="w-5 h-5" />}
                title="Personal Information"
              />
              
              {/* 2-column grid layout like Airbnb */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="border-b border-border md:border-r md:border-b-0">
                  <ProfileFieldRow
                    icon={<User className="w-5 h-5" />}
                    label="Full Name"
                    value={formValues.full_name}
                    onClick={() => openFieldModal('full_name')}
                    required
                  />
                </div>
                
                <div className="border-b border-border">
                  <ProfileFieldRow
                    icon={<Calendar className="w-5 h-5" />}
                    label="Age"
                    value={formValues.age}
                    onClick={() => openFieldModal('age')}
                  />
                </div>
                
                <div className="border-b border-border md:border-r">
                  <ProfileFieldRow
                    icon={<User className="w-5 h-5" />}
                    label="Gender"
                    value={formValues.gender}
                    onClick={() => openFieldModal('gender')}
                  />
                </div>
                
                <div className="border-b border-border md:border-b-0">
                  <ProfileFieldRow
                    icon={<MapPin className="w-5 h-5" />}
                    label="Home Location"
                    value={getLocationDisplay()}
                    onClick={() => openFieldModal('location')}
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div>
              <ProfileSectionHeader
                icon={<GraduationCap className="w-5 h-5" />}
                title="Academic Information"
              />
              
              {/* 2-column grid layout like Airbnb */}
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="border-b border-border md:border-r md:border-b-0">
                  <ProfileFieldRow
                    icon={<Building2 className="w-5 h-5" />}
                    label="University"
                    value={formValues.university}
                    onClick={() => openFieldModal('university')}
                  />
                </div>
                
                <div className="border-b border-border">
                  <ProfileFieldRow
                    icon={<GraduationCap className="w-5 h-5" />}
                    label="Major"
                    value={formValues.major}
                    onClick={() => openFieldModal('major')}
                  />
                </div>
                
                <div className="md:col-span-2 border-b border-border md:border-b-0">
                  <ProfileFieldRow
                    icon={<Calendar className="w-5 h-5" />}
                    label="Year of Study"
                    value={formValues.year_of_study}
                    onClick={() => openFieldModal('year_of_study')}
                  />
                </div>
              </div>
            </div>

            {/* Accommodation Status */}
            <div>
              <ProfileSectionHeader
                icon={<Home className="w-5 h-5" />}
                title="Accommodation Status"
              />
              
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleAccommodationStatusChange('need_dorm')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      accommodationStatus === 'need_dorm'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <Home className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-medium">Need Dorm</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Looking for accommodation
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleAccommodationStatusChange('have_dorm')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      accommodationStatus === 'have_dorm'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-center">
                      <Home className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-medium">Have Dorm</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Already have accommodation
                      </div>
                    </div>
                  </button>
                </div>

                {/* Have Dorm Flow - Matches onboarding sequence */}
                {accommodationStatus === 'have_dorm' && (
                  <div className="space-y-4 pt-4">
                    {/* 1. Current Dorm/Room Selection - Show immediately for have_dorm */}
                    <div id="current-dorm-section" className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
                      <div className="space-y-2">
                        <Label>Current Dorm</Label>
                        <Select value={currentDormId} onValueChange={handleCurrentDormChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your dorm" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDorms.map((dorm) => (
                              <SelectItem key={dorm.id} value={dorm.id}>
                                {dorm.name} - {dorm.area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {currentDormId && (
                        <div className="space-y-2">
                          <Label>Current Room</Label>
                          <Select value={currentRoomId} onValueChange={handleCurrentRoomChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your room" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRooms.map((room) => (
                                <SelectItem key={room.id} value={room.id}>
                                  {room.name} - {room.type} ({room.capacity_occupied}/{room.capacity})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {currentRoomId && isRoomFull && (
                            <p className="text-sm text-amber-600 dark:text-amber-500">
                              ⚠️ This room is currently full. You may need to wait for a spot to open.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Looking for Roommate - Only show AFTER room selected AND room is NOT single */}
                    {currentDormId && currentRoomId && !isSingleRoom(availableRooms.find(r => r.id === currentRoomId)?.type) && (
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Looking for Roommate</div>
                            <div className="text-sm text-muted-foreground">
                              Find someone to share your current place
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={needsRoommateCurrentPlace}
                          onCheckedChange={(checked) => handleRoommateToggle('current', checked)}
                        />
                      </div>
                    )}

                    {/* 3. AI Personality Matching - Only show if roommate toggle is ON */}
                    {currentDormId && currentRoomId && !isSingleRoom(availableRooms.find(r => r.id === currentRoomId)?.type) && needsRoommateCurrentPlace && (
                      <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Brain className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">AI Personality Matching</div>
                              <div className="text-sm text-muted-foreground">
                                Find compatible roommates based on personality
                              </div>
                            </div>
                          </div>
                          <Switch
                            checked={enablePersonalityMatching}
                            onCheckedChange={handlePersonalityMatchingToggle}
                          />
                        </div>
                        
                        {personalityTestCompleted && (
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30">
                              ✓ Test Completed
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm"
                              type="button"
                              onClick={() => setShowPersonalitySurvey(true)}
                            >
                              Edit Survey
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Housing Preferences - Only show if need_dorm */}
            {accommodationStatus === 'need_dorm' && (
              <div>
                <ProfileSectionHeader
                  icon={<Home className="w-5 h-5" />}
                  title="Housing Preferences"
                />
                
                <div className="space-y-0 divide-y divide-border">
                  <ProfileFieldRow
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Budget (per month)"
                    value={formValues.budget ? `$${formValues.budget}` : undefined}
                    onClick={() => openFieldModal('budget')}
                  />
                  
                  {/* Inline City Selection */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Preferred City</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Byblos', 'Beirut'] as const).map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => handleCityChange(city)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            selectedCity === city
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <span className="font-medium">{city}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Area Dropdown - Only show when city is selected */}
                    {selectedCity && (
                      <div className="mt-4">
                        <Label className="mb-2 block text-sm text-muted-foreground">Preferred Area</Label>
                        <Select 
                          value={selectedAreas[0] || ''} 
                          onValueChange={(value) => handleAreaSelect(value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred area" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {(selectedCity === 'Byblos' ? byblosAreas : beirutAreas).map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  <ProfileFieldRow
                    icon={<Home className="w-5 h-5" />}
                    label="Room Type"
                    value={formValues.room_type}
                    onClick={() => openFieldModal('room_type')}
                  />
                </div>

                {/* Looking for Roommate toggle - only visible after non-single room type selected */}
                {formValues.room_type && !isSingleRoom(formValues.room_type) && (
                  <div className="flex items-center justify-between p-4 mt-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Looking for Roommate</div>
                        <div className="text-sm text-muted-foreground">
                          Find someone to share a new dorm with
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={needsRoommateNewDorm}
                      onCheckedChange={(checked) => handleRoommateToggle('new', checked)}
                    />
                  </div>
                )}

                {/* Personality Matching - Only show if seeking roommate */}
                {needsRoommateNewDorm && (
                  <div className="space-y-3 p-4 mt-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Personality Matching</div>
                          <div className="text-sm text-muted-foreground">
                            Find compatible roommates based on personality
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={enablePersonalityMatching}
                        onCheckedChange={handlePersonalityMatchingToggle}
                      />
                    </div>
                    
                    {personalityTestCompleted && (
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30">
                          ✓ Test Completed
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm"
                          type="button"
                          onClick={() => setShowPersonalitySurvey(true)}
                        >
                          Edit Survey
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Sticky Footer Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg z-50">
        <div className="flex justify-end max-w-7xl mx-auto px-4 lg:px-12">
          <Button
            type="submit"
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="w-full lg:w-auto lg:min-w-[200px]"
            size="lg"
          >
            {getActionButtonText()}
          </Button>
        </div>
      </div>

      {/* Field Edit Modals */}
      <ProfileFieldModal
        open={editingField === 'full_name'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Full Name"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="Enter your full name"
        />
      </ProfileFieldModal>


      <ProfileFieldModal
        open={editingField === 'age'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Age"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(parseInt(e.target.value) || '')}
          placeholder="Enter your age"
          type="number"
          min="16"
          max="100"
        />
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'gender'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Gender"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Male">Male</SelectItem>
            <SelectItem value="Female">Female</SelectItem>
          </SelectContent>
        </Select>
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'location'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Home Location"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Governorate</Label>
            <Select value={tempGovernorate} onValueChange={(value) => setTempGovernorate(value as Governorate)}>
              <SelectTrigger>
                <SelectValue placeholder="Select governorate" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(residentialAreas).map((gov) => (
                  <SelectItem key={gov} value={gov}>
                    {gov}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tempGovernorate && (
            <div className="space-y-2">
              <Label>District</Label>
              <Select value={tempDistrict} onValueChange={setTempDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {tempAvailableDistricts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {tempDistrict && (
            <div className="space-y-2">
              <Label>Town/Village</Label>
              <Select value={tempTown} onValueChange={setTempTown}>
                <SelectTrigger>
                  <SelectValue placeholder="Select town/village" />
                </SelectTrigger>
                <SelectContent>
                  {tempAvailableTowns.map((town) => (
                    <SelectItem key={town} value={town}>
                      {town}
                    </SelectItem>
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
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select university" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {universities.map((uni) => (
              <SelectItem key={uni} value={uni}>
                {uni}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'major'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Major"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="Enter your major"
        />
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'year_of_study'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Year of Study"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Select value={tempValue?.toString() || ''} onValueChange={(value) => setTempValue(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <SelectItem key={year} value={year.toString()}>
                Year {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'budget'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Monthly Budget"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(parseInt(e.target.value) || '')}
          placeholder="Enter your budget"
          type="number"
          min="0"
        />
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'preferred_location'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Preferred Location"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>City</Label>
            <Select 
              value={tempValue || ''} 
              onValueChange={(value) => {
                setTempValue(value);
                // Reset areas when city changes
                setTempAreas([]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Byblos">Byblos</SelectItem>
                <SelectItem value="Beirut">Beirut</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <AnimatePresence mode="wait">
            {tempValue && (
              <motion.div
                key={tempValue}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <Label>Areas</Label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto border border-border rounded-lg p-3">
                  {(tempValue === 'Byblos' ? byblosAreas : beirutAreas).map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`modal-${area}`}
                        checked={tempAreas.includes(area)}
                        onCheckedChange={() => toggleArea(area)}
                      />
                      <label
                        htmlFor={`modal-${area}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {area}
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'room_type'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Room Type"
        onSave={saveFieldValue}
        isSaving={isSaving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger>
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>

      {/* Personality Survey Modal */}
      <PersonalitySurveyModal
        open={showPersonalitySurvey}
        onOpenChange={setShowPersonalitySurvey}
        userId={userId}
        onComplete={() => {
          setPersonalityTestCompleted(true);
          setShowPersonalitySurvey(false);
        }}
      />
    </div>
  );
};
