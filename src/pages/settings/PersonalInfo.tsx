import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, User, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { MobileMenuRow } from '@/components/mobile/MobileMenuRow';
import BottomNav from '@/components/BottomNav';

interface PersonalInfoData {
  full_name: string;
  phone_number: string;
  governorate: string;
  district: string;
  town_village: string;
}

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, isAuthenticated, isAuthReady } = useAuth();
  const { role } = useRoleGuard();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [data, setData] = useState<PersonalInfoData>({
    full_name: '',
    phone_number: '',
    governorate: '',
    district: '',
    town_village: '',
  });

  // Drawer states
  const [editField, setEditField] = useState<keyof PersonalInfoData | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated || !userId) {
      navigate('/settings');
      return;
    }
    loadPersonalInfo();
  }, [isAuthReady, isAuthenticated, userId, role]);

  const loadPersonalInfo = async () => {
    try {
      // Get email from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }

      // Get profile data based on role
      if (role === 'student') {
        const { data: profile } = await supabase
          .from('students')
          .select('full_name, phone_number, governorate, district, town_village')
          .eq('user_id', userId)
          .single();

        if (profile) {
          setData({
            full_name: profile.full_name || '',
            phone_number: profile.phone_number || '',
            governorate: profile.governorate || '',
            district: profile.district || '',
            town_village: profile.town_village || '',
          });
        }
      } else if (role === 'owner') {
        const { data: profile } = await supabase
          .from('owners')
          .select('full_name, phone_number')
          .eq('user_id', userId)
          .single();

        if (profile) {
          setData({
            full_name: profile.full_name || '',
            phone_number: profile.phone_number || '',
            governorate: '',
            district: '',
            town_village: '',
          });
        }
      } else if (role === 'admin') {
        const { data: profile } = await supabase
          .from('admins')
          .select('full_name, phone_number')
          .eq('user_id', userId)
          .single();

        if (profile) {
          setData({
            full_name: profile.full_name || '',
            phone_number: profile.phone_number || '',
            governorate: '',
            district: '',
            town_village: '',
          });
        }
      }
    } catch (err) {
      console.error('Error loading personal info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveField = async () => {
    if (!editField || !userId) return;
    setSaving(true);

    try {
      const tableName = role === 'student' ? 'students' : role === 'owner' ? 'owners' : 'admins';
      const { error } = await supabase
        .from(tableName)
        .update({ [editField]: editValue })
        .eq('user_id', userId);

      if (error) throw error;

      setData(prev => ({ ...prev, [editField]: editValue }));
      setEditField(null);
      toast({
        title: 'Saved',
        description: 'Your information has been updated',
      });
    } catch (err) {
      console.error('Error saving:', err);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEditDrawer = (field: keyof PersonalInfoData) => {
    setEditField(field);
    setEditValue(data[field] || '');
  };

  const getFieldLabel = (field: keyof PersonalInfoData) => {
    const labels: Record<keyof PersonalInfoData, string> = {
      full_name: 'Legal name',
      phone_number: 'Phone number',
      governorate: 'Governorate',
      district: 'District',
      town_village: 'Town/Village',
    };
    return labels[field];
  };

  const getFieldDescription = (field: keyof PersonalInfoData) => {
    const descriptions: Record<keyof PersonalInfoData, string> = {
      full_name: 'This is the name on your official ID',
      phone_number: 'Add a number so confirmed owners and Roomy can contact you',
      governorate: 'Your governorate of residence',
      district: 'Your district within the governorate',
      town_village: 'Your town or village',
    };
    return descriptions[field];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-6 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center active:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Personal info</h1>
          </div>

          {/* Info Fields */}
          <div className="divide-y divide-border/20">
            {/* Legal Name */}
            <MobileMenuRow
              icon={<User className="w-6 h-6" />}
              label="Legal name"
              subtitle={data.full_name || 'Add'}
              onClick={() => openEditDrawer('full_name')}
            />

            {/* Email - Read only */}
            <div className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-medium text-foreground">Email address</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
            </div>

            {/* Phone */}
            <MobileMenuRow
              icon={<Phone className="w-6 h-6" />}
              label="Phone number"
              subtitle={data.phone_number || 'Add'}
              onClick={() => openEditDrawer('phone_number')}
            />

            {/* Address Section - Only for students */}
            {role === 'student' && (
              <>
                <MobileMenuRow
                  icon={<MapPin className="w-6 h-6" />}
                  label="Governorate"
                  subtitle={data.governorate || 'Add'}
                  onClick={() => openEditDrawer('governorate')}
                />
                <MobileMenuRow
                  icon={<MapPin className="w-6 h-6" />}
                  label="District"
                  subtitle={data.district || 'Add'}
                  onClick={() => openEditDrawer('district')}
                />
                <MobileMenuRow
                  icon={<MapPin className="w-6 h-6" />}
                  label="Town/Village"
                  subtitle={data.town_village || 'Add'}
                  onClick={() => openEditDrawer('town_village')}
                />
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Edit Field Drawer */}
      <Drawer open={!!editField} onOpenChange={(open) => !open && setEditField(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{editField ? getFieldLabel(editField) : ''}</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground mb-4">
              {editField ? getFieldDescription(editField) : ''}
            </p>
            <div>
              <Label htmlFor="edit-field">{editField ? getFieldLabel(editField) : ''}</Label>
              <Input
                id="edit-field"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={`Enter your ${editField ? getFieldLabel(editField).toLowerCase() : ''}`}
                className="mt-2"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleSaveField} disabled={saving} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <BottomNav />
    </div>
  );
}
