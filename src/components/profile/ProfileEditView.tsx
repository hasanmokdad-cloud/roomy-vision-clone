import { useState, useEffect } from 'react';
import { User, ChevronRight, Calendar, Users, GraduationCap, BookOpen, DollarSign, MapPin, Home, ArrowLeft, Briefcase, Globe, Music, Clock, PawPrint, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileFieldModal } from './ProfileFieldModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { universities } from '@/data/universities';
import { housingAreas } from '@/data/housingAreas';
import { roomTypes } from '@/data/roomTypes';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';

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
  { key: 'age', label: 'Decade I was born', icon: <Calendar className="w-5 h-5" />, type: 'number' },
  { key: 'gender', label: 'Gender', icon: <Users className="w-5 h-5" />, type: 'select', options: ['Male', 'Female'] },
  { key: 'university', label: 'Where I went to school', icon: <GraduationCap className="w-5 h-5" />, type: 'select', options: universities },
  { key: 'major', label: 'My work', icon: <Briefcase className="w-5 h-5" />, type: 'text' },
  { key: 'year_of_study', label: 'Year of study', icon: <BookOpen className="w-5 h-5" />, type: 'select', options: ['1', '2', '3', '4', '5'] },
  { key: 'budget', label: 'Budget ($/month)', icon: <DollarSign className="w-5 h-5" />, type: 'number' },
  { key: 'preferred_housing_area', label: "Where I've always wanted to go", icon: <Globe className="w-5 h-5" />, type: 'select', options: housingAreas },
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

  const handlePhotoUploaded = (url: string) => {
    setCurrentPhotoUrl(url);
    onProfileUpdated();
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

  // Split fields into two columns for Airbnb-style layout
  const leftFields = FIELDS.filter((_, i) => i % 2 === 0);
  const rightFields = FIELDS.filter((_, i) => i % 2 === 1);

  return (
    <div className="max-w-[900px]">
      {/* Two-column layout: Avatar left, Fields right */}
      <div className="flex gap-16">
        {/* Left Column - Avatar */}
        <div className="flex-shrink-0">
          <ProfilePhotoUpload 
            userId={userId}
            currentUrl={currentPhotoUrl}
            onUploaded={handlePhotoUploaded}
            tableName="students"
          />
        </div>

        {/* Right Column - Profile Fields */}
        <div className="flex-1">
          {/* My Profile Header */}
          <div className="mb-8">
            <h2 
              className="text-[32px] font-semibold text-[#222222] mb-2 tracking-tight"
              style={{ fontFamily: 'Circular, -apple-system, BlinkMacSystemFont, Roboto, Helvetica Neue, sans-serif' }}
            >
              My profile
            </h2>
            <p className="text-base text-[#717171] leading-relaxed">
              Hosts and guests can see your profile and it may appear across Roomy to help us build trust in our community.{' '}
              <button className="underline font-medium text-[#222222]">Learn more</button>
            </p>
          </div>

          {/* Two-column Profile Fields Grid */}
          <div className="grid grid-cols-2 gap-x-8">
            {/* Left Column Fields */}
            <div className="divide-y divide-[#EBEBEB]">
              {leftFields.map((field) => (
                <FieldRow 
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  onClick={() => openFieldEditor(field.key)}
                />
              ))}
            </div>

            {/* Right Column Fields */}
            <div className="divide-y divide-[#EBEBEB]">
              {rightFields.map((field) => (
                <FieldRow 
                  key={field.key}
                  field={field}
                  value={formData[field.key]}
                  onClick={() => openFieldEditor(field.key)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Done Button - Fixed at bottom right */}
      <div className="flex justify-end mt-12">
        <Button
          onClick={onClose}
          className="bg-[#222222] hover:bg-[#000000] text-white font-semibold px-8 py-3 h-auto rounded-lg text-base"
        >
          Done
        </Button>
      </div>

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

// Field Row Component
interface FieldRowProps {
  field: { key: FieldKey; label: string; icon: React.ReactNode };
  value: string;
  onClick: () => void;
}

function FieldRow({ field, value, onClick }: FieldRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-5 hover:bg-[#F7F7F7] transition-colors text-left group"
    >
      <div className="w-6 h-6 flex items-center justify-center text-[#717171]">
        {field.icon}
      </div>
      <span className="text-[15px] text-[#222222]">
        {value || field.label}
      </span>
    </button>
  );
}
