import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  X, 
  Camera, 
  User, 
  ChevronRight,
  Calendar,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  MapPin,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { universities } from '@/data/universities';
import { housingAreas } from '@/data/housingAreas';
import { roomTypes } from '@/data/roomTypes';
import type { ProfileSection } from '@/pages/profile/CompleteProfile';

interface EditProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  profileData: any;
  onProfileUpdated: () => void;
  initialSection?: ProfileSection;
}

type FieldKey = 'full_name' | 'age' | 'gender' | 'university' | 'major' | 'year_of_study' | 'budget' | 'preferred_housing_area' | 'room_type';

const SECTION_FIELDS: Record<string, FieldKey[]> = {
  personal: ['full_name', 'age', 'gender'],
  academic: ['university', 'major', 'year_of_study'],
  housing: ['budget', 'preferred_housing_area', 'room_type'],
};

export function EditProfileDrawer({ 
  open, 
  onClose, 
  userId, 
  profileData, 
  onProfileUpdated,
  initialSection
}: EditProfileDrawerProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
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
      setProfilePhotoUrl(profileData.profile_photo_url);
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

      const { error: updateError } = await supabase
        .from('students')
        .update({ profile_photo_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setProfilePhotoUrl(publicUrl);
      toast({ title: 'Photo uploaded', description: 'Your profile photo has been updated' });
      onProfileUpdated();
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const saveField = async () => {
    if (!editingField) return;
    setSaving(true);

    try {
      let value: any = editValue;
      if (['age', 'year_of_study', 'budget'].includes(editingField)) {
        value = parseInt(editValue) || null;
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

  const openFieldEditor = (field: FieldKey) => {
    setEditingField(field);
    setEditValue(formData[field]);
  };

  const allFields: { key: FieldKey; label: string; icon: React.ReactNode; type: 'text' | 'number' | 'select'; options?: string[] }[] = [
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

  // Filter fields by section if initialSection is provided
  const fields = initialSection && SECTION_FIELDS[initialSection]
    ? allFields.filter(f => SECTION_FIELDS[initialSection].includes(f.key))
    : allFields;

  const sectionTitles: Record<string, string> = {
    personal: 'Personal Info',
    academic: 'Academic Info',
    housing: 'Housing Preferences',
  };

  return (
    <>
      <Drawer open={open && !editingField} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DrawerContent className="h-[95vh]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
              <DrawerClose asChild onClick={onClose}>
                <button className="w-10 h-10 rounded-full hover:bg-muted/30 flex items-center justify-center">
                  <X className="w-6 h-6" />
                </button>
              </DrawerClose>
              <DrawerTitle className="text-lg font-semibold">{initialSection ? sectionTitles[initialSection] : 'Edit profile'}</DrawerTitle>
              <div className="w-10" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                    <AvatarImage src={profilePhotoUrl || undefined} />
                    <AvatarFallback className="bg-muted text-3xl">
                      {formData.full_name?.charAt(0).toUpperCase() || <User className="w-12 h-12" />}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer border-4 border-background hover:bg-primary/90 transition-colors">
                    <Camera className="w-5 h-5 text-primary-foreground" />
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
                  className="mt-3 text-primary font-semibold text-sm"
                  onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
                >
                  {uploading ? 'Uploading...' : 'Add'}
                </button>
              </div>

              {/* My Profile Section */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">My profile</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The information you share will be used to help find your perfect dorm and roommate matches.
                </p>
              </div>

              {/* Profile Fields */}
              <div className="divide-y divide-border/20">
                {fields.map((field) => (
                  <button
                    key={field.key}
                    onClick={() => openFieldEditor(field.key)}
                    className="w-full flex items-center justify-between py-4 active:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground">
                        {field.icon}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{field.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formData[field.key] || 'Add'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/40">
              <Button onClick={onClose} className="w-full py-6 text-lg font-semibold">
                Done
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Field Edit Drawer */}
      <Drawer open={!!editingField} onOpenChange={(isOpen) => !isOpen && setEditingField(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {fields.find(f => f.key === editingField)?.label || ''}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6">
            {editingField && (() => {
              const field = allFields.find(f => f.key === editingField);
              if (!field) return null;

              if (field.type === 'select' && field.options) {
                return (
                  <Select value={editValue} onValueChange={setEditValue}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }

              return (
                <div>
                  <Label>{field.label}</Label>
                  <Input
                    type={field.type}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                    className="mt-2"
                  />
                </div>
              );
            })()}
          </div>
          <DrawerFooter>
            <Button onClick={saveField} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => setEditingField(null)} className="w-full">
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
