import { motion } from "framer-motion";

interface FollowUpAction {
  label: string;
  query: string;
}

interface FollowUpButtonsProps {
  actions: FollowUpAction[];
  onActionClick: (query: string, displayText: string) => void;
}

export function FollowUpButtons({ actions, onActionClick }: FollowUpButtonsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onActionClick(action.query, action.label)}
          className="
            px-3 py-2 rounded-xl text-sm font-medium
            bg-secondary/10 text-secondary border border-secondary/30
            hover:bg-secondary/20 hover:border-secondary/50 hover:shadow-md
            transition-all duration-200 cursor-pointer
            active:scale-95
          "
        >
          {action.label}
        </motion.button>
      ))}
    </div>
  );
}
