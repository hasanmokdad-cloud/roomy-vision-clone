import { motion } from 'framer-motion';

interface RoomUnitSetupStepProps {
  kitchenetteType: string; // 'studio' | 'room' | 'mixed' | ''
  balconyType: string; // 'all' | 'none' | 'mixed' | ''
  furnishedType: string; // 'furnished' | 'unfurnished' | 'mixed' | ''
  onKitchenetteTypeChange: (v: string) => void;
  onBalconyTypeChange: (v: string) => void;
  onFurnishedTypeChange: (v: string) => void;
  hasMultipleBlocks?: boolean;
  currentBlockNumber?: number;
}

interface CardOption {
  value: string;
  emoji: string;
  label: string;
  subLabel: string;
}

function SelectionCards({ 
  options, 
  selected, 
  onSelect 
}: { 
  options: CardOption[]; 
  selected: string; 
  onSelect: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
            selected === opt.value
              ? 'border-foreground bg-background shadow-sm'
              : 'border-border hover:border-foreground/50'
          }`}
        >
          <span className="text-xl mt-0.5 shrink-0">{opt.emoji}</span>
          <div>
            <span className="font-medium text-sm text-foreground">{opt.label}</span>
            <p className="text-xs text-muted-foreground mt-0.5">{opt.subLabel}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

export function RoomUnitSetupStep({
  kitchenetteType,
  balconyType,
  furnishedType,
  onKitchenetteTypeChange,
  onBalconyTypeChange,
  onFurnishedTypeChange,
  hasMultipleBlocks = false,
  currentBlockNumber = 1,
}: RoomUnitSetupStepProps) {
  const heading = hasMultipleBlocks
    ? `Tell us about Block ${currentBlockNumber}'s rental units`
    : 'Tell us about your rental units';

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            {heading}
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-2">
            This helps us set up the right options for each unit
          </p>
        </motion.div>

        {/* Question 1 — Kitchenette */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">
            Do your rental units have a private kitchenette?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            A kitchenette is a small cooking area inside the unit itself — not a shared kitchen in the building
          </p>
          <SelectionCards
            options={[
              { value: 'studio', emoji: '🍳', label: 'Yes, all of them do', subLabel: 'Every unit has its own kitchenette' },
              { value: 'room', emoji: '🚫', label: 'No, none of them do', subLabel: 'Units have no kitchenette — a shared kitchen may exist in the building' },
              { value: 'mixed', emoji: '🔀', label: "It depends — some do, some don't", subLabel: "You'll assign this per unit on the next page" },
            ]}
            selected={kitchenetteType}
            onSelect={onKitchenetteTypeChange}
          />
        </motion.div>

        {/* Question 2 — Balcony */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-base font-semibold text-foreground mb-1">
            Do your rental units have a private balcony?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            A private balcony is directly accessible from inside the unit — not a shared terrace or rooftop
          </p>
          <SelectionCards
            options={[
              { value: 'all', emoji: '🌿', label: 'Yes, all of them do', subLabel: 'Every unit has its own balcony' },
              { value: 'none', emoji: '🚫', label: 'No, none of them do', subLabel: 'None of the units have a private balcony' },
              { value: 'mixed', emoji: '🔀', label: "It depends — some do, some don't", subLabel: "You'll assign this per unit on the next page" },
            ]}
            selected={balconyType}
            onSelect={onBalconyTypeChange}
          />
        </motion.div>

        {/* Question 3 — Furnished */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-base font-semibold text-foreground mb-1">
            Are your rental units furnished?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            A furnished unit includes at minimum a bed, desk, wardrobe, and basic furniture — appliances and extras may vary
          </p>
          <SelectionCards
            options={[
              { value: 'furnished', emoji: '✅', label: 'Yes, all of them are', subLabel: 'Every unit comes fully furnished' },
              { value: 'unfurnished', emoji: '🚫', label: 'No, none of them are', subLabel: 'Units are unfurnished — tenants bring their own furniture' },
              { value: 'mixed', emoji: '🔀', label: "It depends — some are, some aren't", subLabel: "You'll assign this per unit on the next page" },
            ]}
            selected={furnishedType}
            onSelect={onFurnishedTypeChange}
          />
        </motion.div>
      </div>
    </div>
  );
}
