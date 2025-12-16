import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MobileSelector } from '@/components/profile/MobileSelector';
import { PersonalitySurveyDrawer } from '@/components/profile/PersonalitySurveyDrawer';
import BottomNav from '@/components/BottomNav';
import { housingAreas } from '@/data/housingAreas';
import { roomTypes } from '@/data/roomTypes';

export default function Preferences() {
  const navigate = useNavigate();
  const { userId, isAuthReady, isAuthenticated, role } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSurveyDrawer, setShowSurveyDrawer] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    budget: '',
    preferred_housing_area: '',
    room_type: '',
    need_roommate: false,
    enable_personality_matching: false,
  });

  const [budgetError, setBudgetError] = useState('');

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated || !userId || role !== 'student') {
      navigate('/profile');
      return;
    }
    loadProfile();
  }, [isAuthReady, isAuthenticated, userId, role]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setProfileData(data);
      setFormData({
        budget: data.budget?.toString() || '',
        preferred_housing_area: data.preferred_housing_area || '',
        room_type: data.room_type || '',
        need_roommate: data.need_roommate || false,
        enable_personality_matching: data.enable_personality_matching || false,
      });
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateBudget = (value: string) => {
    if (!value) {
      setBudgetError('');
      return true;
    }
    const num = parseInt(value);
    if (isNaN(num) || num < 0) {
      setBudgetError('Please enter a valid amount');
      return false;
    }
    setBudgetError('');
    return true;
  };

  const handleBudgetChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setFormData(prev => ({ ...prev, budget: numericValue }));
    validateBudget(numericValue);
  };

  const handleSave = async () => {
    if (!validateBudget(formData.budget)) {
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          budget: formData.budget ? parseInt(formData.budget) : null,
          preferred_housing_area: formData.preferred_housing_area || null,
          room_type: formData.room_type || null,
          need_roommate: formData.need_roommate,
          enable_personality_matching: formData.enable_personality_matching,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Your preferences have been updated' });
      navigate('/profile');
    } catch (err) {
      console.error('Error saving:', err);
      toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSurveyComplete = () => {
    setShowSurveyDrawer(false);
    loadProfile();
    toast({
      title: 'Survey complete!',
      description: 'Your personality preferences have been saved',
    });
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
      <div className="pt-6 px-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center active:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Set Your Preferences</h1>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Budget */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Monthly Budget (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formData.budget}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  placeholder="Enter your budget"
                  className={`pl-10 h-12 ${budgetError ? 'border-destructive' : ''}`}
                />
              </div>
              {budgetError && (
                <p className="text-sm text-destructive">{budgetError}</p>
              )}
            </div>

            {/* Housing Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Preferred Housing Area</label>
              <MobileSelector
                label="Housing Area"
                options={housingAreas}
                value={formData.preferred_housing_area}
                onChange={(val) => setFormData(prev => ({ ...prev, preferred_housing_area: val }))}
                searchable
                placeholder="Select area"
              />
            </div>

            {/* Room Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Room Type</label>
              <MobileSelector
                label="Room Type"
                options={roomTypes}
                value={formData.room_type}
                onChange={(val) => setFormData(prev => ({ ...prev, room_type: val }))}
                placeholder="Select room type"
              />
            </div>

            {/* Need Roommate */}
            <div className="flex items-center justify-between p-4 bg-card border border-border/40 rounded-xl">
              <div>
                <p className="font-medium text-foreground">Need a Roommate</p>
                <p className="text-sm text-muted-foreground">Looking for someone to share with</p>
              </div>
              <Switch
                checked={formData.need_roommate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, need_roommate: checked }))}
              />
            </div>

            {/* Personality Matching */}
            <div className="space-y-3 p-4 bg-card border border-border/40 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Personality Matching</p>
                  <p className="text-sm text-muted-foreground">Better roommate compatibility</p>
                </div>
                <Switch
                  checked={formData.enable_personality_matching}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_personality_matching: checked }))}
                />
              </div>

              {formData.enable_personality_matching && (
                <div className="pt-3 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Survey: {profileData?.personality_test_completed ? (
                        <span className="text-green-500">Completed</span>
                      ) : (
                        <span className="text-yellow-500">Not taken</span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant={profileData?.personality_test_completed ? 'outline' : 'default'}
                      onClick={() => setShowSurveyDrawer(true)}
                    >
                      {profileData?.personality_test_completed ? 'Edit Survey' : 'Take Survey'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border/40">
        <Button
          onClick={handleSave}
          disabled={saving || !!budgetError}
          className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-primary to-secondary"
        >
          {saving ? 'Saving...' : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>

      {/* Personality Survey Drawer */}
      <PersonalitySurveyDrawer
        open={showSurveyDrawer}
        onOpenChange={setShowSurveyDrawer}
        userId={userId!}
        onComplete={handleSurveyComplete}
        existingAnswers={profileData}
      />

      <BottomNav />
    </div>
  );
}
