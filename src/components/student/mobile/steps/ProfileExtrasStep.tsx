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
    <div className="px-6 pt-20 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Optional extras
        </h2>
        <p className="text-muted-foreground mb-8">
          You can add these later from your profile
        </p>

        {/* Profile Photo */}
        <div className="mb-6">
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
        <div className="mb-6">
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
          className="mt-6 p-4 rounded-xl bg-muted/50 text-center"
        >
          <p className="text-sm text-muted-foreground">
            All fields are optional. You can always update these later in your profile settings.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileExtrasStep;
