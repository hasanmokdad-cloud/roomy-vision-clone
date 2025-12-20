import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface MobileSelectDrawerProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function MobileSelectDrawer({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  label,
  disabled = false,
  className,
  triggerClassName,
}: MobileSelectDrawerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue);
    setOpen(false);
  };

  if (!isMobile) {
    // Desktop: use standard Select
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn("h-12 text-base", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={cn("bg-background z-50 max-h-[300px]", className)}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Mobile: use Drawer
  return (
    <>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "w-full h-12 justify-between text-base font-normal",
          !value && "text-muted-foreground",
          triggerClassName
        )}
      >
        {selectedOption?.label || placeholder}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
          <DrawerHeader className="text-left">
            <DrawerTitle>{label || placeholder}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="max-h-[60vh] px-4 pb-6">
            <div className="space-y-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-xl transition-all",
                    "active:scale-[0.98]",
                    value === option.value
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/30 border-2 border-transparent hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "font-medium",
                      value === option.value ? "text-primary" : "text-foreground"
                    )}
                  >
                    {option.label}
                  </span>
                  {value === option.value && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </>
  );
}
