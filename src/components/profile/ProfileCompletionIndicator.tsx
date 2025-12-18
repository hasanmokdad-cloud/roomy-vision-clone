import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSection {
  id: string;
  label: string;
  isComplete: boolean;
  isOptional?: boolean;
}

interface ProfileCompletionIndicatorProps {
  sections: ProfileSection[];
  className?: string;
}

export function ProfileCompletionIndicator({
  sections,
  className,
}: ProfileCompletionIndicatorProps) {
  const requiredSections = sections.filter((s) => !s.isOptional);
  const completedRequired = requiredSections.filter((s) => s.isComplete).length;
  const totalRequired = requiredSections.length;
  const percentage = totalRequired > 0 
    ? Math.round((completedRequired / totalRequired) * 100) 
    : 0;

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Profile Completion
          </span>
          <span className="text-sm font-semibold text-primary">
            {percentage}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Section checklist */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center gap-3 py-1.5"
          >
            <div
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full transition-colors",
                section.isComplete
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-muted-foreground/30"
              )}
            >
              {section.isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <Circle className="h-2 w-2 text-muted-foreground/30" />
              )}
            </div>
            <span
              className={cn(
                "text-sm",
                section.isComplete
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {section.label}
              {section.isOptional && (
                <span className="ml-1 text-xs text-muted-foreground/70">
                  (optional)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to calculate profile sections from student data
export function calculateProfileSections(studentData: {
  full_name?: string | null;
  gender?: string | null;
  governorate?: string | null;
  district?: string | null;
  university?: string | null;
  accommodation_status?: string | null;
  budget?: number | null;
  room_type?: string | null;
  personality_test_completed?: boolean | null;
}): ProfileSection[] {
  const needsDorm = studentData.accommodation_status === 'need_dorm';
  
  return [
    {
      id: "personal",
      label: "Personal Information",
      isComplete: !!(studentData.full_name && studentData.gender),
    },
    {
      id: "location",
      label: "Location",
      isComplete: !!(studentData.governorate && studentData.district),
    },
    {
      id: "academic",
      label: "Academic Information",
      isComplete: !!studentData.university,
    },
    {
      id: "accommodation",
      label: "Accommodation Status",
      isComplete: !!studentData.accommodation_status,
    },
    ...(needsDorm
      ? [
          {
            id: "housing",
            label: "Housing Preferences",
            isComplete: !!(studentData.budget && studentData.room_type),
          },
        ]
      : []),
    {
      id: "personality",
      label: "Personality Survey",
      isComplete: !!studentData.personality_test_completed,
      isOptional: true,
    },
  ];
}
