import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Users, GraduationCap, BookOpen, DollarSign, MapPin, Home, Building2, Sparkles, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';
import { ProfileFieldModal } from './ProfileFieldModal';
import { PersonalitySurveyModal } from './PersonalitySurveyModal';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import { residentialAreas, type Governorate, type District } from '@/data/residentialAreas';
import { universities } from '@/data/universities';
import { studentRoomTypes, isSingleRoom } from '@/data/roomTypes';

interface StudentProfileEditPageProps {
  userId: string;
  onClose: () => void;
}

type EditableField = 'full_name' | 'age' | 'gender' | 'location' | 'university' | 'major' | 'year_of_study' | 'budget' | 'preferred_location' | 'room_type' | 'current_dorm';

interface StudentProfile {
  full_name?: string;
  age?: number;
  gender?: string;
  governorate?: string;
  district?: string;
  town_village?: string;
  university?: string;
  major?: string;
  year_of_study?: number;
  budget?: number;
  preferred_city?: string;
  preferred_areas?: string[];
  room_type?: string;
  accommodation_status?: 'need_dorm' | 'have_dorm';
  needs_roommate_current_place?: boolean;
  needs_roommate_new_dorm?: boolean;
  enable_personality_matching?: boolean;
  personality_test_completed?: boolean;
  current_dorm_id?: string;
  current_room_id?: string;
  profile_photo_url?: string;
  room_confirmed?: boolean;
}

// Area data by city
const byblosAreas = ['Blat', 'Nahr Ibrahim', 'Halat', 'Jeddayel', 'Mastita', 'Fidar', 'Habboub'];
const beirutAreas = ['Hamra', 'Manara', 'Ain El Mraisseh', 'Raoucheh', 'Ras Beirut', 'UNESCO', 
  'Geitawi', 'Dora', 'Badaro', 'Ashrafieh', 'Verdun', 'Sin El Fil', 'Dekwaneh', 'Jdeideh', 
  'Mar Elias', 'Borj Hammoud', 'Hazmieh', 'Furn El Chebbak', 'Tayouneh', 'Jnah', 
  "Ras Al Naba'a", 'Gemmayze', 'Clemenceau', 'Khalde'];

export function StudentProfileEditPage({ userId, onClose }: StudentProfileEditPageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfile>({});
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
  const [isRoomConfirmed, setIsRoomConfirmed] = useState(false);
  const [showPersonalitySurvey, setShowPersonalitySurvey] = useState(false);

  const handlePersonalitySurveyComplete = () => {
    setPersonalityTestCompleted(true);
    setShowPersonalitySurvey(false);
  };
  
  // Location state
  const [tempGovernorate, setTempGovernorate] = useState<Governorate | ''>('');
  const [tempDistrict, setTempDistrict] = useState('');
  const [tempTown, setTempTown] = useState('');
  const [tempAvailableDistricts, setTempAvailableDistricts] = useState<string[]>([]);
  const [tempAvailableTowns, setTempAvailableTowns] = useState<string[]>([]);
  
  // Preferred location state
  const [selectedCity, setSelectedCity] = useState<'Byblos' | 'Beirut' | ''>('');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [tempAreas, setTempAreas] = useState<string[]>([]);
  
  // Current dorm/room state
  const [currentDormId, setCurrentDormId] = useState<string>('');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [availableDorms, setAvailableDorms] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [currentRoomData, setCurrentRoomData] = useState<any>(null);
  const [isRoomFull, setIsRoomFull] = useState(false);
  const [projectedRoomFull, setProjectedRoomFull] = useState(false);

  useEffect(() => {
    loadProfile();
    loadDorms();
  }, [userId]);

  // Load rooms when dorm changes
  useEffect(() => {
    if (currentDormId) {
      loadRoomsForDorm(currentDormId);
    } else {
      setAvailableRooms([]);
    }
  }, [currentDormId]);

  // Update room fullness when room changes
  useEffect(() => {
    if (currentRoomId && currentRoomData) {
      const currentOccupancy = currentRoomData.roomy_confirmed_occupants || 0;
      const capacity = currentRoomData.capacity || 1;
      setIsRoomFull(currentOccupancy >= capacity);
      const projectedOccupancy = isRoomConfirmed ? currentOccupancy : currentOccupancy + 1;
      setProjectedRoomFull(projectedOccupancy >= capacity);
    }
  }, [currentRoomId, currentRoomData, isRoomConfirmed]);

  // Handle temp governorate changes
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

  useEffect(() => {
    if (tempGovernorate && tempDistrict) {
      const govData = residentialAreas[tempGovernorate];
      const towns = (govData as Record<string, string[]>)[tempDistrict] || [];
      setTempAvailableTowns(towns);
    }
  }, [tempDistrict, tempGovernorate]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      setProfileData(data as StudentProfile);
      setProfilePhotoUrl(data.profile_photo_url || null);
      setAccommodationStatus((data.accommodation_status as 'need_dorm' | 'have_dorm') || 'need_dorm');
      setNeedsRoommateCurrentPlace(data.needs_roommate_current_place || false);
      setNeedsRoommateNewDorm(data.needs_roommate_new_dorm || false);
      setEnablePersonalityMatching(data.enable_personality_matching || false);
      setPersonalityTestCompleted(data.personality_test_completed || false);
      setIsRoomConfirmed(data.room_confirmed || false);
      setCurrentDormId(data.current_dorm_id || '');
      setCurrentRoomId(data.current_room_id || '');
      setSelectedCity((data.preferred_city as 'Byblos' | 'Beirut' | '') || '');
      setSelectedAreas(data.preferred_areas || []);
    }
    setLoading(false);
  };

  const loadDorms = async () => {
    const { data } = await supabase
      .from('dorms')
      .select('id, name, area')
      .eq('verification_status', 'Verified')
      .order('name');
    if (data) setAvailableDorms(data);
  };

  const loadRoomsForDorm = async (dormId: string) => {
    const { data } = await supabase
      .from('rooms')
      .select('id, name, type, capacity, capacity_occupied, roomy_confirmed_occupants')
      .eq('dorm_id', dormId)
      .order('name');

    if (data) {
      let selectableRooms = data.filter(room => {
        const roomyConfirmed = room.roomy_confirmed_occupants || 0;
        return roomyConfirmed < (room.capacity || 1);
      });

      if (currentRoomId && !selectableRooms.find(r => r.id === currentRoomId)) {
        const currentRoom = data.find(r => r.id === currentRoomId);
        if (currentRoom) selectableRooms = [currentRoom, ...selectableRooms];
      }

      setAvailableRooms(selectableRooms);

      if (currentRoomId) {
        const roomData = data.find(r => r.id === currentRoomId);
        setCurrentRoomData(roomData || null);
      }
    }
  };

  const openFieldModal = (field: EditableField) => {
    setEditingField(field);
    
    if (field === 'location') {
      setTempGovernorate((profileData.governorate as Governorate) || '');
      setTempDistrict(profileData.district || '');
      setTempTown(profileData.town_village || '');
    } else if (field === 'preferred_location') {
      setTempValue(selectedCity);
      setTempAreas([...selectedAreas]);
    } else if (field === 'current_dorm') {
      setTempValue({ dormId: currentDormId, roomId: currentRoomId });
    } else {
      setTempValue(profileData[field as keyof StudentProfile]);
    }
  };

  const saveFieldValue = async () => {
    if (!editingField) return;
    setSaving(true);

    try {
      let updateData: any = {};

      if (editingField === 'location') {
        updateData = {
          governorate: tempGovernorate || null,
          district: tempDistrict || null,
          town_village: tempTown || null,
        };
        setProfileData(prev => ({ ...prev, ...updateData }));
      } else if (editingField === 'preferred_location') {
        updateData = {
          preferred_city: tempValue || null,
          preferred_areas: tempAreas,
        };
        setSelectedCity(tempValue || '');
        setSelectedAreas(tempAreas);
        setProfileData(prev => ({ ...prev, ...updateData }));
      } else if (editingField === 'current_dorm') {
        updateData = {
          current_dorm_id: tempValue.dormId || null,
          current_room_id: tempValue.roomId || null,
        };
        setCurrentDormId(tempValue.dormId || '');
        setCurrentRoomId(tempValue.roomId || '');
        setProfileData(prev => ({ ...prev, ...updateData }));
      } else {
        updateData = { [editingField]: tempValue };
        setProfileData(prev => ({ ...prev, [editingField]: tempValue }));
      }

      const { error } = await supabase
        .from('students')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Your information has been updated' });
      setEditingField(null);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAccommodationStatusChange = async (status: 'need_dorm' | 'have_dorm') => {
    setAccommodationStatus(status);
    
    const updateData: any = { accommodation_status: status };
    if (status === 'need_dorm') {
      updateData.current_dorm_id = null;
      updateData.current_room_id = null;
      setCurrentDormId('');
      setCurrentRoomId('');
    }

    await supabase.from('students').update(updateData).eq('user_id', userId);
    setProfileData(prev => ({ ...prev, ...updateData }));
  };

  const handleToggleChange = async (field: string, value: boolean) => {
    if (field === 'needs_roommate_current_place') {
      setNeedsRoommateCurrentPlace(value);
      if (!value) {
        setEnablePersonalityMatching(false);
        await supabase.from('students').update({ needs_roommate_current_place: value, enable_personality_matching: false }).eq('user_id', userId);
      } else {
        await supabase.from('students').update({ needs_roommate_current_place: value }).eq('user_id', userId);
      }
    } else if (field === 'needs_roommate_new_dorm') {
      setNeedsRoommateNewDorm(value);
      if (!value) {
        setEnablePersonalityMatching(false);
        await supabase.from('students').update({ needs_roommate_new_dorm: value, enable_personality_matching: false }).eq('user_id', userId);
      } else {
        await supabase.from('students').update({ needs_roommate_new_dorm: value }).eq('user_id', userId);
      }
    } else if (field === 'enable_personality_matching') {
      setEnablePersonalityMatching(value);
      await supabase.from('students').update({ enable_personality_matching: value }).eq('user_id', userId);
    }
  };

  const getLocationDisplay = () => {
    const parts = [profileData.governorate, profileData.district, profileData.town_village].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Add your hometown';
  };

  const getPreferredLocationDisplay = () => {
    if (!selectedCity) return 'Add preferred areas';
    if (selectedAreas.length === 0) return selectedCity;
    return `${selectedCity} · ${selectedAreas.length} area${selectedAreas.length > 1 ? 's' : ''}`;
  };

  const getCurrentDormDisplay = () => {
    if (!currentDormId) return 'Select your dorm';
    const dorm = availableDorms.find(d => d.id === currentDormId);
    const room = availableRooms.find(r => r.id === currentRoomId);
    if (dorm && room) return `${dorm.name} · ${room.name}`;
    if (dorm) return dorm.name;
    return 'Select your dorm';
  };

  const getMatchButtonText = () => {
    // HAVE DORM path
    if (accommodationStatus === 'have_dorm') {
      // Only show "Find Roommate Matches" if:
      // - Student has selected a non-single room
      // - Room is not at full capacity
      // - Student enabled "Need a Roommate" toggle
      if (currentRoomData && !isSingleRoom(currentRoomData.type) && !projectedRoomFull && needsRoommateCurrentPlace) {
        return 'Find Roommate Matches';
      }
      return 'Done';
    }
    
    // NEED DORM path
    if (accommodationStatus === 'need_dorm') {
      // Check if student has entered any dorm-search info
      const hasDormSearchInfo = 
        profileData.budget || 
        (selectedAreas && selectedAreas.length > 0) || 
        profileData.room_type;
      
      if (hasDormSearchInfo) {
        // If non-single room type AND roommate toggle enabled -> "Find Matches"
        if (profileData.room_type && !isSingleRoom(profileData.room_type) && needsRoommateNewDorm) {
          return 'Find Matches';
        }
        // Otherwise just looking for dorm -> "Find Dorm Matches"
        return 'Find Dorm Matches';
      }
    }
    
    // Default: no accommodation status selected or no info entered
    return 'Done';
  };

  const handleBottomAction = () => {
    const buttonText = getMatchButtonText();
    if (buttonText === 'Done') {
      onClose();
    } else {
      navigate('/ai-match');
    }
  };

  // Determine if roommate toggle should be shown
  const showRoommateToggle = (() => {
    if (accommodationStatus === 'need_dorm') {
      // Need Dorm: show toggle when room type is selected and not single
      return profileData.room_type && !isSingleRoom(profileData.room_type);
    }
    
    if (accommodationStatus === 'have_dorm') {
      // Have Dorm: show toggle ONLY when:
      // 1. A room is actually selected (currentRoomData exists)
      // 2. Room type is non-single
      // 3. Room is NOT at full capacity (has space for roommate)
      return currentRoomData && 
             !isSingleRoom(currentRoomData.type) && 
             !projectedRoomFull;
    }
    
    return false;
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <RoomyNavbar />
      
      <div className="max-w-[900px] mx-auto px-6 py-8 pb-32">
        {/* Back button */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[#222222] mb-8 hover:underline"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-base">Back to profile</span>
        </button>

        {/* Two-column layout: Avatar left, Fields right */}
        <div className="flex gap-16">
          {/* Left Column - Avatar */}
          <div className="flex-shrink-0">
            <ProfilePhotoUpload 
              userId={userId}
              currentUrl={profilePhotoUrl}
              onUploaded={(url) => setProfilePhotoUrl(url)}
              tableName="students"
            />
          </div>

          {/* Right Column - Profile Fields */}
          <div className="flex-1">
            {/* Header */}
            <div className="mb-8">
              <h2 
                className="text-[32px] font-semibold text-[#222222] mb-2 tracking-tight"
                style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
              >
                My profile
              </h2>
              <p className="text-base text-[#717171] leading-relaxed">
                Students can see your profile when looking for roommates or dorms.
              </p>
            </div>

            {/* Personal Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#222222] mb-4">Personal Information</h3>
              <div className="divide-y divide-[#EBEBEB]">
                <FieldRow icon={<User className="w-5 h-5" />} label="Full name" value={profileData.full_name} onClick={() => openFieldModal('full_name')} />
                <FieldRow icon={<Calendar className="w-5 h-5" />} label="Age" value={profileData.age?.toString()} onClick={() => openFieldModal('age')} />
                <FieldRow icon={<Users className="w-5 h-5" />} label="Gender" value={profileData.gender} onClick={() => openFieldModal('gender')} />
                <FieldRow icon={<MapPin className="w-5 h-5" />} label="Hometown" value={getLocationDisplay()} onClick={() => openFieldModal('location')} />
              </div>
            </div>

            {/* Academic Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#222222] mb-4">Academic Information</h3>
              <div className="divide-y divide-[#EBEBEB]">
                <FieldRow icon={<GraduationCap className="w-5 h-5" />} label="University" value={profileData.university} onClick={() => openFieldModal('university')} />
                <FieldRow icon={<BookOpen className="w-5 h-5" />} label="Major" value={profileData.major} onClick={() => openFieldModal('major')} />
                <FieldRow icon={<BookOpen className="w-5 h-5" />} label="Year of study" value={profileData.year_of_study?.toString()} onClick={() => openFieldModal('year_of_study')} />
              </div>
            </div>

            {/* Accommodation Status */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#222222] mb-4">Accommodation Status</h3>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => handleAccommodationStatusChange('need_dorm')}
                  disabled={isRoomConfirmed}
                  className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
                    accommodationStatus === 'need_dorm'
                      ? 'border-[#222222] bg-[#F7F7F7]'
                      : 'border-[#DDDDDD] hover:border-[#222222]'
                  } ${isRoomConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Search className="w-6 h-6 mx-auto mb-2 text-[#222222]" />
                  <span className="block text-sm font-medium text-[#222222]">Need Dorm</span>
                  <span className="block text-xs text-[#717171] mt-1">I'm looking for a dorm</span>
                </button>
                <button
                  onClick={() => handleAccommodationStatusChange('have_dorm')}
                  disabled={isRoomConfirmed}
                  className={`flex-1 py-4 px-6 rounded-xl border-2 transition-all ${
                    accommodationStatus === 'have_dorm'
                      ? 'border-[#222222] bg-[#F7F7F7]'
                      : 'border-[#DDDDDD] hover:border-[#222222]'
                  } ${isRoomConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2 text-[#222222]" />
                  <span className="block text-sm font-medium text-[#222222]">Have Dorm</span>
                  <span className="block text-xs text-[#717171] mt-1">I already have a dorm</span>
                </button>
              </div>

              {/* Conditional fields based on status */}
              {accommodationStatus === 'need_dorm' && (
                <div className="divide-y divide-[#EBEBEB]">
                  <FieldRow icon={<DollarSign className="w-5 h-5" />} label="Monthly budget" value={profileData.budget ? `$${profileData.budget}` : undefined} onClick={() => openFieldModal('budget')} />
                  <FieldRow icon={<MapPin className="w-5 h-5" />} label="Preferred areas" value={getPreferredLocationDisplay()} onClick={() => openFieldModal('preferred_location')} />
                  <FieldRow icon={<Home className="w-5 h-5" />} label="Room type" value={profileData.room_type} onClick={() => openFieldModal('room_type')} />
                </div>
              )}

              {accommodationStatus === 'have_dorm' && (
                <div className="divide-y divide-[#EBEBEB]">
                  <FieldRow icon={<Building2 className="w-5 h-5" />} label="Current dorm & room" value={getCurrentDormDisplay()} onClick={() => openFieldModal('current_dorm')} />
                </div>
              )}
            </div>

            {/* Roommate Matching Section */}
            {showRoommateToggle && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#222222] mb-4">Roommate Matching</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-4 border-b border-[#EBEBEB]">
                    <div>
                      <p className="text-[15px] text-[#222222]">Looking for a roommate?</p>
                      <p className="text-sm text-[#717171]">Enable to find compatible roommates</p>
                    </div>
                    <Switch
                      checked={accommodationStatus === 'have_dorm' ? needsRoommateCurrentPlace : needsRoommateNewDorm}
                      onCheckedChange={(checked) => handleToggleChange(
                        accommodationStatus === 'have_dorm' ? 'needs_roommate_current_place' : 'needs_roommate_new_dorm',
                        checked
                      )}
                    />
                  </div>

                  {(needsRoommateCurrentPlace || needsRoommateNewDorm) && (
                    <div className="flex items-center justify-between py-4 border-b border-[#EBEBEB]">
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-[15px] text-[#222222]">AI Personality Matching</p>
                          <p className="text-sm text-[#717171]">
                            {personalityTestCompleted ? 'Survey completed' : 'Take the personality survey'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPersonalitySurvey(true)}
                          className="text-[#222222] border-[#222222] hover:bg-[#F7F7F7] font-medium"
                        >
                          {personalityTestCompleted ? 'Edit' : 'Start'}
                        </Button>
                        <Switch
                          checked={enablePersonalityMatching}
                          onCheckedChange={(checked) => handleToggleChange('enable_personality_matching', checked)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] px-6 py-4">
        <div className="max-w-[900px] mx-auto flex justify-end items-center">
          <Button
            onClick={handleBottomAction}
            className={`font-semibold px-8 ${
              getMatchButtonText() === 'Done' 
                ? 'border border-[#222222] bg-white text-[#222222] hover:bg-[#F7F7F7]' 
                : 'bg-[#FF385C] hover:bg-[#E31C5F] text-white'
            }`}
          >
            {getMatchButtonText()}
          </Button>
        </div>
      </div>

      {/* Field Edit Modals */}
      <ProfileFieldModal
        open={editingField === 'full_name'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Full name"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="Enter your full name"
          className="border-[#DDDDDD]"
        />
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'age'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Age"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Input
          type="number"
          value={tempValue || ''}
          onChange={(e) => setTempValue(parseInt(e.target.value) || null)}
          placeholder="Enter your age"
          className="border-[#DDDDDD]"
        />
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'gender'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Gender"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger className="border-[#DDDDDD]">
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
        title="Hometown"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#717171] mb-1 block">Governorate</label>
            <Select value={tempGovernorate} onValueChange={(val) => setTempGovernorate(val as Governorate)}>
              <SelectTrigger className="border-[#DDDDDD]">
                <SelectValue placeholder="Select governorate" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(residentialAreas).map((gov) => (
                  <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tempGovernorate && (
            <div>
              <label className="text-sm text-[#717171] mb-1 block">District</label>
              <Select value={tempDistrict} onValueChange={setTempDistrict}>
                <SelectTrigger className="border-[#DDDDDD]">
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {tempAvailableDistricts.map((dist) => (
                    <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {tempDistrict && (
            <div>
              <label className="text-sm text-[#717171] mb-1 block">Town/Village</label>
              <Select value={tempTown} onValueChange={setTempTown}>
                <SelectTrigger className="border-[#DDDDDD]">
                  <SelectValue placeholder="Select town" />
                </SelectTrigger>
                <SelectContent>
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
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger className="border-[#DDDDDD]">
            <SelectValue placeholder="Select university" />
          </SelectTrigger>
          <SelectContent>
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
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Input
          value={tempValue || ''}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder="Enter your major"
          className="border-[#DDDDDD]"
        />
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'year_of_study'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Year of study"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Select value={tempValue?.toString() || ''} onValueChange={(val) => setTempValue(parseInt(val))}>
          <SelectTrigger className="border-[#DDDDDD]">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((year) => (
              <SelectItem key={year} value={year.toString()}>Year {year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'budget'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Monthly budget"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Input
          type="number"
          value={tempValue || ''}
          onChange={(e) => setTempValue(parseInt(e.target.value) || null)}
          placeholder="Enter budget in USD"
          className="border-[#DDDDDD]"
        />
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'preferred_location'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Preferred areas"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#717171] mb-1 block">City</label>
            <Select value={tempValue || ''} onValueChange={(val) => {
              setTempValue(val);
              setTempAreas([]);
            }}>
              <SelectTrigger className="border-[#DDDDDD]">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Byblos">Byblos</SelectItem>
                <SelectItem value="Beirut">Beirut</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {tempValue && (
            <div>
              <label className="text-sm text-[#717171] mb-2 block">Areas (select multiple)</label>
              <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                {(tempValue === 'Byblos' ? byblosAreas : beirutAreas).map((area) => (
                  <label key={area} className="flex items-center gap-2 py-2 cursor-pointer">
                    <Checkbox
                      checked={tempAreas.includes(area)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTempAreas([...tempAreas, area]);
                        } else {
                          setTempAreas(tempAreas.filter(a => a !== area));
                        }
                      }}
                    />
                    <span className="text-sm text-[#222222]">{area}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'room_type'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Room type"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <Select value={tempValue || ''} onValueChange={setTempValue}>
          <SelectTrigger className="border-[#DDDDDD]">
            <SelectValue placeholder="Select room type" />
          </SelectTrigger>
          <SelectContent>
            {studentRoomTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ProfileFieldModal>

      <ProfileFieldModal
        open={editingField === 'current_dorm'}
        onOpenChange={(open) => !open && setEditingField(null)}
        title="Current dorm & room"
        onSave={saveFieldValue}
        isSaving={saving}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#717171] mb-1 block">Dorm</label>
            <Select 
              value={tempValue?.dormId || ''} 
              onValueChange={(val) => {
                setTempValue({ dormId: val, roomId: '' });
                loadRoomsForDorm(val);
              }}
            >
              <SelectTrigger className="border-[#DDDDDD]">
                <SelectValue placeholder="Select dorm" />
              </SelectTrigger>
              <SelectContent>
                {availableDorms.map((dorm) => (
                  <SelectItem key={dorm.id} value={dorm.id}>
                    {dorm.name} {dorm.area && `(${dorm.area})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {tempValue?.dormId && (
            <div>
              <label className="text-sm text-[#717171] mb-1 block">Room</label>
              <Select 
                value={tempValue?.roomId || ''} 
                onValueChange={(val) => setTempValue({ ...tempValue, roomId: val })}
              >
                <SelectTrigger className="border-[#DDDDDD]">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </ProfileFieldModal>

      {/* Personality Survey Modal */}
      <PersonalitySurveyModal
        open={showPersonalitySurvey}
        onOpenChange={setShowPersonalitySurvey}
        userId={userId}
        onComplete={handlePersonalitySurveyComplete}
      />
    </div>
  );
}

// Field Row Component
interface FieldRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}

function FieldRow({ icon, label, value, onClick }: FieldRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-5 hover:bg-[#F7F7F7] transition-colors text-left group"
    >
      <div className="w-6 h-6 flex items-center justify-center text-[#717171]">
        {icon}
      </div>
      <span className="text-[15px] text-[#222222]">
        {value || label}
      </span>
    </button>
  );
}
