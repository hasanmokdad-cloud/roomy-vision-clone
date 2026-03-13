import { motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';

interface ProfileExtrasStepProps {
  data: {
    profile_photo_url: string;
    phone_number: string;
  };
  onChange: (data: Partial<ProfileExtrasStepProps['data']>) => void;
  userId: string;
  userInitial: string;
}

const ProfileExtrasStep = ({ data, onChange, userId, userInitial }: ProfileExtrasStepProps) => {
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
            <Label className="text-base font-medium mb-3 block text-center">Profile photo</Label>
            <div className="flex justify-center">
              <ProfilePhotoUpload
                userId={userId}
                currentUrl={data.profile_photo_url || null}
                onUploaded={(url) => onChange({ profile_photo_url: url })}
                tableName="students"
                userInitial={userInitial}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              A photo helps other tenants, including potential roommates, and owners to recognize you
            </p>
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
