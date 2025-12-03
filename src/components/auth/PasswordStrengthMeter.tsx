import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const checks = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strengthPercentage = (passedChecks / 3) * 100;

  const getStrengthColor = () => {
    if (passedChecks === 0) return "bg-muted";
    if (passedChecks === 1) return "bg-red-500";
    if (passedChecks === 2) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthLabel = () => {
    if (passedChecks === 0) return "";
    if (passedChecks === 1) return "Weak";
    if (passedChecks === 2) return "Medium";
    return "Strong";
  };

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", getStrengthColor())}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
        {password.length > 0 && (
          <p className={cn(
            "text-xs font-medium text-right",
            passedChecks === 1 && "text-red-500",
            passedChecks === 2 && "text-yellow-500",
            passedChecks === 3 && "text-green-500"
          )}>
            {getStrengthLabel()}
          </p>
        )}
      </div>

      {/* Validation Checks */}
      <div className="space-y-2">
        <CheckItem checked={checks.minLength} label="Minimum 8 characters" />
        <CheckItem checked={checks.hasNumber} label="At least 1 number" />
        <CheckItem checked={checks.hasUppercase} label="At least 1 uppercase letter" />
      </div>
    </div>
  );
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {checked ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-muted-foreground" />
      )}
      <span className={cn(
        "transition-colors",
        checked ? "text-green-500" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );
}
