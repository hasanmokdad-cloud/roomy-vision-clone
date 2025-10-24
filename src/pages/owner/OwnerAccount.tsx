import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function OwnerAccount() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [owner, setOwner] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    notify_email: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOwnerData();
  }, []);

  const loadOwnerData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (!error && data) {
      setOwner(data);
      setFormData({
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
        notify_email: data.notify_email ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('owners')
        .update(formData)
        .eq('id', owner.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Account settings updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading account settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Account Settings</h1>
        <p className="text-foreground/60 mt-2">Manage your profile and notification preferences</p>
      </div>

      <div className="glass-hover rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-black/20 border-white/10"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                value={owner?.email}
                disabled
                className="bg-black/20 border-white/10 opacity-60"
              />
              <p className="text-xs text-foreground/60 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <Label>Phone Number</Label>
              <Input
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="+961 XX XXX XXX"
                className="bg-black/20 border-white/10"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h2 className="text-xl font-bold mb-4">Email Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 glass rounded-xl">
              <div className="flex-1">
                <Label htmlFor="notify-email" className="font-semibold">
                  Email me about listing updates
                </Label>
                <p className="text-sm text-foreground/60 mt-1">
                  Receive emails when your listings are verified or edited by admins
                </p>
              </div>
              <Switch
                id="notify-email"
                checked={formData.notify_email}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, notify_email: checked })
                }
              />
            </div>

            <div className="text-sm text-foreground/60 p-4 glass rounded-xl">
              <p className="font-semibold mb-2">What you'll receive:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>🎉 Verification confirmation when your listing goes live</li>
                <li>📝 Update notifications when listing details are changed</li>
                <li>⚡ Limited to 5 emails per hour (we respect your inbox!)</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gradient-to-r from-primary to-secondary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
