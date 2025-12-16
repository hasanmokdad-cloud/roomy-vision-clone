import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, GraduationCap, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MobileSelector } from '../MobileSelector';
import { universities } from '@/data/universities';
import type { StudentProfile } from '../ProfileHub';

interface AcademicInfoCardProps {
  profile: StudentProfile | null;
  userId: string;
  onProfileUpdated: () => void;
}

export function AcademicInfoCard({ profile, userId, onProfileUpdated }: AcademicInfoCardProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    university: profile?.university || '',
    major: profile?.major || '',
    year_of_study: profile?.year_of_study?.toString() || '',
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          university: formData.university || null,
          major: formData.major || null,
          year_of_study: formData.year_of_study ? parseInt(formData.year_of_study) : null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Academic info updated' });
      setIsEditing(false);
      onProfileUpdated();
    } catch (err) {
      console.error('Error saving:', err);
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      university: profile?.university || '',
      major: profile?.major || '',
      year_of_study: profile?.year_of_study?.toString() || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between active:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-blue-500" />
          </div>
          <span className="font-semibold text-foreground">Academic Info</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsed Summary */}
      {!isExpanded && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {profile?.university || 'University: Not set'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {profile?.major || 'Major: Not set'}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Year: {profile?.year_of_study || 'Not set'}
          </Badge>
        </div>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border/30"
          >
            <div className="p-4 space-y-4">
              {!isEditing ? (
                // View Mode
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground">University</p>
                        <p className="font-medium text-foreground">
                          {profile?.university || 'Not set'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Major</p>
                      <p className="font-medium text-foreground">
                        {profile?.major || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year of Study</p>
                      <p className="font-medium text-foreground">
                        {profile?.year_of_study || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="w-full"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </>
              ) : (
                // Edit Mode
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">University</label>
                      <MobileSelector
                        label="University"
                        options={universities}
                        value={formData.university}
                        onChange={(val) => setFormData(prev => ({ ...prev, university: val }))}
                        searchable
                        placeholder="Select university"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Major</label>
                      <Input
                        value={formData.major}
                        onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                        placeholder="Enter your major"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Year of Study</label>
                      <MobileSelector
                        label="Year"
                        options={['1', '2', '3', '4', '5']}
                        value={formData.year_of_study}
                        onChange={(val) => setFormData(prev => ({ ...prev, year_of_study: val }))}
                        placeholder="Select year"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="flex-1"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
