import { motion } from 'framer-motion';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';

interface TenantPreferenceStepProps {
  tenantSelection: string;
  onTenantSelectionChange: (value: string) => void;
  genderPreference: string;
  onGenderPreferenceChange: (value: string) => void;
  propertyType?: string;
}

const tenantOptions = [
  {
    id: 'student_only',
    emoji: '🎓',
    label: 'Students only',
    subLabel: 'Only university students can rent from you',
  },
  {
    id: 'mixed',
    emoji: '👥',
    label: 'Mixed (students and non-students)',
    subLabel: 'Open to both students and non-students',
  },
];

const genderOptions = [
  { id: 'male', emoji: '👨', label: 'Male only', subLabel: '' },
  { id: 'female', emoji: '👩', label: 'Female only', subLabel: '' },
  { id: 'mixed', emoji: '🤝', label: 'Mixed', subLabel: 'No gender restriction' },
];

export function TenantPreferenceStep({
  tenantSelection,
  onTenantSelectionChange,
  genderPreference,
  onGenderPreferenceChange,
  propertyType = 'dorm',
}: TenantPreferenceStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Who can stay in your {dormLabel}?
          </h1>
        </motion.div>

        {/* Section 1 — Tenant type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Which tenants can rent from you?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            This determines who can view and reserve your listings
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {tenantOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => onTenantSelectionChange(option.id)}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[100px] text-left ${
                  tenantSelection === option.id
                    ? 'border-foreground bg-background shadow-sm'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <div className="flex flex-col items-start mt-2">
                  <span className="font-medium text-sm text-foreground">
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {option.subLabel}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Section 2 — Gender preference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Which gender can stay in your units?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            You can specify gender restrictions or keep it open to everyone
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
            {genderOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => onGenderPreferenceChange(option.id)}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[100px] text-left ${
                  genderPreference === option.id
                    ? 'border-foreground bg-background shadow-sm'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <div className="flex flex-col items-start mt-2">
                  <span className="font-medium text-sm text-foreground">
                    {option.label}
                  </span>
                  {option.subLabel && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {option.subLabel}
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
