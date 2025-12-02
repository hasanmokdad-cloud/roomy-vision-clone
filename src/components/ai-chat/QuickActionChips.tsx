import { motion } from "framer-motion";
import { Home, DollarSign, Users, MapPin, Sparkles } from "lucide-react";

interface ChipData {
  label: string;
  query: string;
  icon?: string;
}

interface QuickActionChipsProps {
  chips: ChipData[];
  onChipClick: (query: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="w-3 h-3" />,
  dollar: <DollarSign className="w-3 h-3" />,
  users: <Users className="w-3 h-3" />,
  map: <MapPin className="w-3 h-3" />,
  sparkles: <Sparkles className="w-3 h-3" />,
};

export function QuickActionChips({ chips, onChipClick }: QuickActionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, index) => (
        <motion.button
          key={chip.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onChipClick(chip.query)}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5 
            rounded-full text-xs font-medium
            bg-primary/10 text-primary border border-primary/30
            hover:bg-primary/20 hover:border-primary/50 hover:shadow-sm
            transition-all duration-200 cursor-pointer
            active:scale-95
          "
        >
          {chip.icon && iconMap[chip.icon]}
          {chip.label}
        </motion.button>
      ))}
    </div>
  );
}

// Default quick actions for different contexts
export const defaultQuickActions = {
  initial: [
    { label: "🏠 Show me dorms", query: "Show me available dorms", icon: "home" },
    { label: "💰 Under $500", query: "Show dorms under $500 per month", icon: "dollar" },
    { label: "👥 Find roommates", query: "Help me find compatible roommates", icon: "users" },
  ],
  afterDorm: [
    { label: "Similar dorms", query: "Show me similar dorms", icon: "home" },
    { label: "Cheaper options", query: "Show me cheaper options", icon: "dollar" },
    { label: "Roommates here", query: "Find roommates for this dorm", icon: "users" },
  ],
  afterMismatch: [
    { label: "My gender", query: "Show dorms that accept my gender", icon: "users" },
    { label: "Closer to uni", query: "Show dorms closer to my university", icon: "map" },
    { label: "Different area", query: "Show dorms in a different area", icon: "map" },
  ],
  afterRoommate: [
    { label: "More matches", query: "Show me more roommate matches", icon: "users" },
    { label: "Same university", query: "Show roommates from my university", icon: "sparkles" },
    { label: "Similar budget", query: "Show roommates with similar budget", icon: "dollar" },
  ],
};
