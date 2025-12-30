import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type MuteDuration = '8hours' | '1week' | 'always';

interface MuteNotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMute: (duration: MuteDuration) => void;
}

export function MuteNotificationsModal({
  open,
  onOpenChange,
  onMute,
}: MuteNotificationsModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<MuteDuration>('8hours');

  const handleMute = () => {
    onMute(selectedDuration);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mute notifications</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          No one else in this chat will see that you muted it, and you will still be notified if you are mentioned.
        </p>
        
        <RadioGroup
          value={selectedDuration}
          onValueChange={(value) => setSelectedDuration(value as MuteDuration)}
          className="space-y-3 pt-4"
        >
          <div className="flex items-center space-x-3">
            <RadioGroupItem 
              value="8hours" 
              id="mute-8hours"
              className="border-[#00a884] text-[#00a884] data-[state=checked]:border-[#00a884] data-[state=checked]:text-[#00a884]"
            />
            <Label htmlFor="mute-8hours" className="text-sm font-normal cursor-pointer">
              8 hours
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem 
              value="1week" 
              id="mute-1week"
              className="border-[#00a884] text-[#00a884] data-[state=checked]:border-[#00a884] data-[state=checked]:text-[#00a884]"
            />
            <Label htmlFor="mute-1week" className="text-sm font-normal cursor-pointer">
              1 week
            </Label>
          </div>
          <div className="flex items-center space-x-3">
            <RadioGroupItem 
              value="always" 
              id="mute-always"
              className="border-[#00a884] text-[#00a884] data-[state=checked]:border-[#00a884] data-[state=checked]:text-[#00a884]"
            />
            <Label htmlFor="mute-always" className="text-sm font-normal cursor-pointer">
              Always
            </Label>
          </div>
        </RadioGroup>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-[#00a884] hover:text-[#00a884] hover:bg-[#00a884]/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMute}
            className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
          >
            Mute
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
