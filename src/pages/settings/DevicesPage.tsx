import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Trash2, 
  Shield, 
  ChevronLeft,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResponsiveAlertModal } from "@/components/ui/responsive-alert-modal";
import { formatDistanceToNow } from "date-fns";

interface Device {
  id: string;
  device_name: string;
  device_type: string;
  browser_name: string;
  os_name: string;
  ip_region: string;
  is_current: boolean;
  is_verified: boolean;
  last_used_at: string;
  created_at: string;
}

export default function DevicesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_devices")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_verified", true)
        .order("last_used_at", { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (err) {
      console.error("Error loading devices:", err);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (device: Device) => {
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from("user_devices")
        .delete()
        .eq("id", deviceToDelete.id);

      if (error) throw error;

      // Log the removal
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("device_security_logs").insert({
          user_id: user.id,
          event_type: "device_removed",
          metadata: { device_name: deviceToDelete.device_name }
        });
      }

      setDevices(devices.filter(d => d.id !== deviceToDelete.id));
      toast({
        title: "Device Removed",
        description: "The device will need to be re-verified on next login."
      });
    } catch (err) {
      console.error("Error deleting device:", err);
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeviceToDelete(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "mobile": return <Smartphone className="w-6 h-6" />;
      case "tablet": return <Tablet className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse text-foreground/60">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Trusted Devices</h1>
            <p className="text-sm text-foreground/60">Manage devices that can access your account</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Security Info */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">Device Verification Active</p>
              <p className="text-foreground/60">
                New devices require email verification before accessing your account. 
                Remove a device to require re-verification on next login.
              </p>
            </div>
          </div>
        </Card>

        {/* Device List */}
        <AnimatePresence mode="popLayout">
          {devices.length === 0 ? (
            <Card className="p-8 text-center">
              <Smartphone className="w-12 h-12 mx-auto text-foreground/30 mb-3" />
              <p className="text-foreground/60">No trusted devices found</p>
              <p className="text-sm text-foreground/40 mt-1">
                Log in to add your first device
              </p>
            </Card>
          ) : (
            devices.map((device, index) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-4 ${device.is_current ? 'border-primary/50 bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${device.is_current ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground/60'}`}>
                      {getDeviceIcon(device.device_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{device.device_name}</span>
                        {device.is_current && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/60">
                        {device.ip_region && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {device.ip_region}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(new Date(device.last_used_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {!device.is_current && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => handleDeleteClick(device)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      <ResponsiveAlertModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Device?"
        description={`${deviceToDelete?.device_name} will be removed from your trusted devices. It will need to be verified again on the next login attempt.`}
        cancelText="Cancel"
        confirmText="Remove Device"
        onConfirm={confirmDelete}
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
}
