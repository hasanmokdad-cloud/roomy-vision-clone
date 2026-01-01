import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Brain, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuthSession } from '@/hooks/useAuthSession';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ResponsiveAlertModal } from '@/components/ui/responsive-alert-modal';

export default function PrivacySettings() {
  const navigate = useNavigate();
  const { userId } = useAuthSession();
  const [aiMatchingEnabled, setAiMatchingEnabled] = useState(true);
  const [isLoadingPreference, setIsLoadingPreference] = useState(true);
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [profile, setProfile] = useState<{ full_name?: string; email?: string } | null>(null);

  // Fetch profile and AI matching preference
  useEffect(() => {
    const fetchProfileAndPreferences = async () => {
      if (!userId) return;
      
      const { data } = await supabase
        .from('students')
        .select('full_name, email, enable_personality_matching')
        .eq('user_id', userId)
        .single();
      
      if (data) {
        setProfile(data);
        setAiMatchingEnabled(data.enable_personality_matching ?? true);
      }
      setIsLoadingPreference(false);
    };
    
    fetchProfileAndPreferences();
  }, [userId]);

  const handleAIMatchingToggle = async (enabled: boolean) => {
    if (!userId) return;
    
    setAiMatchingEnabled(enabled);
    setIsUpdatingPreference(true);
    
    try {
      const { error } = await supabase
        .from('students')
        .update({ enable_personality_matching: enabled })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      toast.success(
        enabled 
          ? "AI matching enabled. You'll now appear in roommate match results."
          : "AI matching disabled. Your profile won't appear in match results."
      );
    } catch (error) {
      // Revert on error
      setAiMatchingEnabled(!enabled);
      toast.error('Failed to update AI matching preference');
    } finally {
      setIsUpdatingPreference(false);
    }
  };

  const handleDownloadData = () => {
    const subject = encodeURIComponent('Data Export Request');
    const body = encodeURIComponent(
      'Hello,\n\nI would like to request a copy of all personal data associated with my account.\n\nThank you.'
    );
    window.location.href = `mailto:security@roomylb.com?subject=${subject}&body=${body}`;
    toast.success('Opening email to request data export');
  };

  const handleClearAIMemory = async () => {
    if (!userId) return;
    setIsClearing(true);
    try {
      await supabase.from('chat_sessions').delete().eq('user_id', userId);
      await supabase.from('chat_context').delete().eq('user_id', userId);
      toast.success('AI memory cleared successfully');
    } catch (error) {
      toast.error('Failed to clear AI memory');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeletionConfirm = () => {
    const userName = profile?.full_name || profile?.email || 'User';
    const subject = encodeURIComponent(`Account Deletion Request – ${userName}`);
    const body = encodeURIComponent(
      'Please permanently delete my account and all stored data.'
    );
    window.location.href = `mailto:security@roomylb.com?subject=${subject}&body=${body}`;
    setShowDeletionModal(false);
    toast.success('Opening email to request account deletion');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Privacy & Data</h1>
            <p className="text-xs text-muted-foreground">Manage your data and privacy settings</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Your Data Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">YOUR DATA</h2>
          <div className="bg-card rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/30">
            <button
              onClick={handleDownloadData}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Download my data</p>
                <p className="text-xs text-muted-foreground">Request a copy of your personal data</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/legal/privacy#section-1')}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">View what we store</p>
                <p className="text-xs text-muted-foreground">See our data collection practices</p>
              </div>
            </button>
          </div>
        </section>

        {/* Data Controls Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">DATA CONTROLS</h2>
          <div className="bg-card rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/30">
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">AI Matching</p>
                <p className="text-xs text-muted-foreground">
                  {aiMatchingEnabled 
                    ? "Your profile appears in roommate matches" 
                    : "You're hidden from match results"}
                </p>
              </div>
              <Switch
                checked={aiMatchingEnabled}
                onCheckedChange={handleAIMatchingToggle}
                disabled={isLoadingPreference || isUpdatingPreference}
              />
            </div>

            <button
              onClick={handleClearAIMemory}
              disabled={isClearing}
              className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center">
                <Brain className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Clear AI Memory</p>
                <p className="text-xs text-muted-foreground">Delete conversation history with AI assistant</p>
              </div>
            </button>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section>
          <h2 className="text-sm font-medium text-destructive mb-3 px-1">DANGER ZONE</h2>
          <div className="bg-card rounded-2xl border border-destructive/30 overflow-hidden">
            <button
              onClick={() => setShowDeletionModal(true)}
              className="w-full flex items-center gap-3 p-4 hover:bg-destructive/5 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Delete my account</p>
                <p className="text-xs text-muted-foreground">Permanently remove all your data</p>
              </div>
            </button>
          </div>

          {/* Info Card */}
          <div className="mt-3 p-3 bg-muted/30 rounded-xl flex gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Account deletion requests are processed within 30 days. Some cached data may take additional time to be fully removed.
            </p>
          </div>
        </section>
      </div>

      {/* Deletion Confirmation Modal */}
      <ResponsiveAlertModal
        open={showDeletionModal}
        onOpenChange={setShowDeletionModal}
        title="Request Account Deletion"
        description="This will send a deletion request to our security team. Processing takes up to 30 days."
        confirmText="Continue to email"
        cancelText="Keep my account"
        onConfirm={handleDeletionConfirm}
        variant="destructive"
      >
        <div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">Data that will be permanently deleted:</p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              Profile information (name, email, phone, university)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              Housing preferences and saved rooms
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              AI personality questionnaire and match scores
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              All messages and conversation history
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              Reservation and booking records
            </li>
            <li className="flex items-start gap-2">
              <span className="text-destructive">•</span>
              Profile photos and uploaded files
            </li>
          </ul>
          <p className="text-destructive font-medium pt-2">This action cannot be undone.</p>
        </div>
      </ResponsiveAlertModal>
    </div>
  );
}
