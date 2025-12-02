import { motion, AnimatePresence } from "framer-motion";
import { 
  DollarSign, 
  GraduationCap, 
  MapPin, 
  Home, 
  Users, 
  User,
  Brain,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

interface UserContext {
  budget?: number;
  university?: string;
  preferred_area?: string;
  need_dorm?: boolean;
  need_roommate?: boolean;
  gender?: string;
  personality_enabled?: boolean;
}

interface ContextPillsProps {
  context: UserContext;
  isVisible: boolean;
}

interface PillData {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

export function ContextPills({ context, isVisible }: ContextPillsProps) {
  const pills: PillData[] = [
    context.budget && {
      icon: <DollarSign className="w-3 h-3" />,
      label: "Budget",
      value: `$${context.budget}/mo`,
      color: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    context.university && {
      icon: <GraduationCap className="w-3 h-3" />,
      label: "University",
      value: context.university,
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    context.preferred_area && {
      icon: <MapPin className="w-3 h-3" />,
      label: "Area",
      value: context.preferred_area,
      color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
    {
      icon: <Home className="w-3 h-3" />,
      label: "Need Dorm",
      value: context.need_dorm ? "Yes" : "No",
      color: context.need_dorm 
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-muted text-muted-foreground border-border",
    },
    {
      icon: <Users className="w-3 h-3" />,
      label: "Need Roommate",
      value: context.need_roommate ? "Yes" : "No",
      color: context.need_roommate
        ? "bg-secondary/10 text-secondary border-secondary/20"
        : "bg-muted text-muted-foreground border-border",
    },
    context.gender && {
      icon: <User className="w-3 h-3" />,
      label: "Gender",
      value: context.gender,
      color: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    },
    {
      icon: <Brain className="w-3 h-3" />,
      label: "Personality",
      value: context.personality_enabled ? "Enabled" : "Disabled",
      color: context.personality_enabled
        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
        : "bg-muted text-muted-foreground border-border",
    },
  ].filter(Boolean) as PillData[];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden border-b border-border/50 bg-muted/30"
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                AI is using this info from your profile
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <TooltipProvider delayDuration={200}>
                {pills.map((pill, index) => (
                  <Tooltip key={pill.label}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                          border cursor-help transition-all hover:shadow-sm
                          ${pill.color}
                        `}
                      >
                        {pill.icon}
                        <span className="hidden sm:inline">{pill.label}:</span>
                        <span className="font-semibold">{pill.value}</span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="text-xs">
                        This comes from your profile.{" "}
                        <Link to="/profile" className="text-primary underline">
                          Update in Profile
                        </Link>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
