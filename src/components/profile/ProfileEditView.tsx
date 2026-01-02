import { useState, useEffect } from 'react';
import { User, Camera, ChevronRight, Calendar, Users, GraduationCap, BookOpen, DollarSign, MapPin, Home, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ProfileFieldModal } from './ProfileFieldModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { universities } from '@/data/universities';
import { housingAreas } from '@/data/housingAreas';
import { roomTypes } from '@/data/roomTypes';

interface ProfileData {
  profile_photo_url?: string | null;
  full_name?: string;
  age?: number;
  gender?: string;
  university?: string;
  major?: string;
  year_of_study?: number;
  budget?: number;
  preferred_housing_area?: string;
  room_type?: string;
  governorate?: string;
  district?: string;
}

type FieldKey = 'full_name' | 'age' | 'gender' | 'university' | 'major' | 'year_of_study' | 'budget' | 'preferred_housing_area' | 'room_type';

interface ProfileEditViewProps {
  userId: string;
  profileData: ProfileData | null;
  profilePhotoUrl: string | null;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const FIELDS: { key: FieldKey; label: string; icon: React.ReactNode; type: 'text' | 'number' | 'select'; options?: string[] }[] = [
  { key: 'full_name', label: 'Full name', icon: <User className="w-5 h-5" />, type: 'text' },
  { key: 'age', label: 'Age', icon: <Calendar className="w-5 h-5" />, type: 'number' },
  { key: 'gender', label: 'Gender', icon: <Users className="w-5 h-5" />, type: 'select', options: ['Male', 'Female'] },
  { key: 'university', label: 'University', icon: <GraduationCap className="w-5 h-5" />, type: 'select', options: universities },
  { key: 'major', label: 'Major', icon: <BookOpen className="w-5 h-5" />, type: 'text' },
  { key: 'year_of_study', label: 'Year of study', icon: <Calendar className="w-5 h-5" />, type: 'select', options: ['1', '2', '3', '4', '5'] },
  { key: 'budget', label: 'Budget ($/month)', icon: <DollarSign className="w-5 h-5" />, type: 'number' },
  { key: 'preferred_housing_area', label: 'Preferred area', icon: <MapPin className="w-5 h-5" />, type: 'select', options: housingAreas },
  { key: 'room_type', label: 'Room type', icon: <Home className="w-5 h-5" />, type: 'select', options: roomTypes },
];

export function ProfileEditView({
  userId,
  profileData,
  profilePhotoUrl,
  onClose,
  onProfileUpdated,
}: ProfileEditViewProps) {
  const { toast } = useToast();
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(profilePhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Record<FieldKey, string>>({
    full_name: '',
    age: '',
    gender: '',
    university: '',
    major: '',
    year_of_study: '',
    budget: '',
    preferred_housing_area: '',
    room_type: '',
  });

  useEffect(() => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        age: profileData.age?.toString() || '',
        gender: profileData.gender || '',
        university: profileData.university || '',
        major: profileData.major || '',
        year_of_study: profileData.year_of_study?.toString() || '',
        budget: profileData.budget?.toString() || '',
        preferred_housing_area: profileData.preferred_housing_area || '',
        room_type: profileData.room_type || '',
      });
    }
  }, [profileData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // Update with cache buster
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('students')
        .update({ profile_photo_url: urlWithCache })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setCurrentPhotoUrl(urlWithCache);
      toast({ title: 'Photo uploaded', description: 'Your profile photo has been updated' });
      onProfileUpdated();
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const openFieldEditor = (field: FieldKey) => {
    setEditingField(field);
    setEditValue(formData[field]);
  };

  const saveField = async () => {
    if (!editingField) return;
    setSaving(true);

    try {
      let value: string | number | null = editValue;
      if (['age', 'year_of_study', 'budget'].includes(editingField)) {
        value = editValue ? parseInt(editValue) : null;
      }

      const { error } = await supabase
        .from('students')
        .update({ [editingField]: value })
        .eq('user_id', userId);

      if (error) throw error;

      setFormData(prev => ({ ...prev, [editingField]: editValue }));
      setEditingField(null);
      toast({ title: 'Saved', description: 'Your information has been updated' });
      onProfileUpdated();
    } catch (err) {
      console.error('Save error:', err);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const currentField = FIELDS.find(f => f.key === editingField);

  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        onClick={onClose}
        className="flex items-center gap-2 text-[#222222] hover:text-[#717171] transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back to profile</span>
      </button>

      {/* Large Avatar with Add button */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <Avatar className="w-48 h-48 border-4 border-white shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
            <AvatarImage src={currentPhotoUrl || undefined} />
            <AvatarFallback className="bg-[#222222] text-white text-5xl font-semibold">
              {formData.full_name?.charAt(0).toUpperCase() || <User className="w-16 h-16" />}
            </AvatarFallback>
          </Avatar>
          <label className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer border border-[#DDDDDD] hover:bg-[#F7F7F7] transition-colors">
            <Camera className="w-6 h-6 text-[#222222]" />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
        <button
          onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
          className="mt-4 text-base font-semibold text-[#222222] underline underline-offset-2"
        >
          {uploading ? 'Uploading...' : 'Add'}
        </button>
      </div>

      {/* My Profile Header */}
      <div>
        <h2 className="text-[32px] font-bold text-[#222222] mb-2">My profile</h2>
        <p className="text-base text-[#717171]">
          The information you share will be used to help find your perfect dorm and roommate matches.
        </p>
      </div>

      {/* Profile Fields Grid */}
      <div className="divide-y divide-[#DDDDDD]">
        {FIELDS.map((field) => (
          <button
            key={field.key}
            onClick={() => openFieldEditor(field.key)}
            className="w-full flex items-center justify-between py-5 hover:bg-[#F7F7F7] transition-colors -mx-4 px-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center text-[#717171]">
                {field.icon}
              </div>
              <div className="text-left">
                <p className="text-base font-medium text-[#222222]">{field.label}</p>
                <p className="text-sm text-[#717171]">
                  {formData[field.key] || 'Add'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#717171]" />
          </button>
        ))}
      </div>

      {/* Done Button */}
      <Button
        onClick={onClose}
        className="w-full bg-[#222222] hover:bg-[#000000] text-white font-semibold py-4 rounded-lg text-base"
      >
        Done
      </Button>

      {/* Field Edit Modal */}
      <ProfileFieldModal
        open={!!editingField}
        onOpenChange={(open) => !open && setEditingField(null)}
        title={currentField?.label || ''}
        onSave={saveField}
        isSaving={saving}
      >
        {currentField?.type === 'select' && currentField.options ? (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="border-[#DDDDDD]">
              <SelectValue placeholder={`Select ${currentField.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {currentField.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            type={currentField?.type || 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={`Enter ${currentField?.label.toLowerCase()}`}
            className="border-[#DDDDDD]"
          />
        )}
      </ProfileFieldModal>
    </div>
  );
}
