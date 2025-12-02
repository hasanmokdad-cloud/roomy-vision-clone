import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, X } from "lucide-react";
import { useState } from "react";
import { useMicPermission } from "@/contexts/MicPermissionContext";

interface MicPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MicPermissionModal = ({ open, onOpenChange }: MicPermissionModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const { requestPermission } = useMicPermission();

  const handleEnableMic = async () => {
    setIsRequesting(true);
    setError(null);

    const granted = await requestPermission();

    if (granted) {
      onOpenChange(false);
    } else {
      setError(
        "Permission denied. Please enable microphone access from Settings → Safari → Microphone."
      );
    }

    setIsRequesting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Microphone Permission
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Roomy needs access to your microphone to enable voice messages.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleEnableMic}
            disabled={isRequesting}
            className="w-full"
          >
            <Mic className="w-4 h-4 mr-2" />
            {isRequesting ? "Requesting..." : "Enable Microphone"}
          </Button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
