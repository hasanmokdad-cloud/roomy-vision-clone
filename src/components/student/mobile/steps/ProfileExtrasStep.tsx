import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Camera, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileExtrasStepProps {
  data: {
    profile_photo_url: string;
    phone_number: string;
  };
  onChange: (data: Partial<ProfileExtrasStepProps['data']>) => void;
}

const ProfileExtrasStep = ({ data, onChange }: ProfileExtrasStepProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="text-center mb-10">
            <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground mb-2">
              Optional extras
            </h1>
            <p className="text-muted-foreground mt-2">
              You can add these later from your profile
            </p>
          </div>

          {/* Profile Photo */}
          <div className="mb-8">
            <Label className="text-base font-medium mb-3 block">Profile photo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={data.profile_photo_url} />
                <AvatarFallback className="bg-muted">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  type="url"
                  value={data.profile_photo_url}
                  onChange={(e) => onChange({ profile_photo_url: e.target.value })}
                  placeholder="Paste image URL or skip"
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A photo helps roommates recognize you
                </p>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="mb-8">
            <Label className="text-base font-medium mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone number
            </Label>
            <Input
              type="tel"
              value={data.phone_number}
              onChange={(e) => onChange({ phone_number: e.target.value })}
              placeholder="+961 XX XXX XXX"
              className="h-12"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For verification and emergency contact
            </p>
          </div>

          {/* Skip note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 rounded-xl bg-muted/50 text-center"
          >
            <p className="text-sm text-muted-foreground">
              All fields are optional. You can always update these later in your profile settings.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileExtrasStep;
