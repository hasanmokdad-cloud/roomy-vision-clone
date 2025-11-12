import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, Globe, Brain, Save, Trash2 } from 'lucide-react';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { settingsManager, type UserSettings } from '@/utils/settings';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, userId } = useAuthGuard();
  const [settings, setSettings] = useState<UserSettings>(settingsManager.load());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && userId) {
      settingsManager.loadFromSupabase(userId).then((loadedSettings) => {
        setSettings(loadedSettings);
      });
    }
  }, [loading, userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      settingsManager.save(settings);
      await settingsManager.syncWithSupabase(userId || undefined);
      toast({
        title: 'Settings saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = settingsManager.toggleTheme();
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  };

  const handleClearAIMemory = async () => {
    if (!userId) return;
    
    try {
      await fetch('/api/reset-ai-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      toast({
        title: 'AI Memory Cleared',
        description: 'Your AI preferences have been reset.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear AI memory.',
        variant: 'destructive',
      });
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen relative bg-gradient-to-b from-[#0F1624] to-[#15203B]">
      <Navbar />

      <div className="container mx-auto px-6 py-32 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold mb-2 gradient-text">Settings</h1>
          <p className="text-white/60 mb-8">Manage your account preferences and personalization</p>

          <div className="space-y-6">
            {/* Theme */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {settings.theme === 'dark' ? (
                    <Moon className="w-6 h-6 text-primary" />
                  ) : (
                    <Sun className="w-6 h-6 text-secondary" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-white">Theme</h3>
                    <p className="text-sm text-white/60">
                      Current: {settings.theme === 'dark' ? 'Dark' : 'Light'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleThemeToggle}
                  variant="outline"
                  className="border-white/20 hover:border-primary/50"
                >
                  Toggle
                </Button>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Bell className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Notifications</h3>
                    <p className="text-sm text-white/60">Receive updates about new dorms</p>
                  </div>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, notifications: checked }))
                  }
                />
              </div>
            </Card>

            {/* Language */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Globe className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Language</h3>
                    <p className="text-sm text-white/60">
                      Current: {settings.language.toUpperCase()}
                    </p>
                  </div>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      language: e.target.value as 'en' | 'ar' | 'fr',
                    }))
                  }
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white backdrop-blur-md"
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                  <option value="fr">Français</option>
                </select>
              </div>
            </Card>

            {/* AI Memory */}
            <Card className="glass p-6 border-white/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Memory</h3>
                    <p className="text-sm text-white/60">
                      Allow AI to remember your preferences
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.aiMemory}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, aiMemory: checked }))
                  }
                />
              </div>
              {settings.aiMemory && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <Button
                    onClick={handleClearAIMemory}
                    variant="outline"
                    size="sm"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear AI Memory
                  </Button>
                </div>
              )}
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="border-white/20 text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
