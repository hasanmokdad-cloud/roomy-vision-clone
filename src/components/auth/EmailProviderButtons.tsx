import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface EmailProviderButtonsProps {
  variant?: "gradient" | "outline";
}

export function EmailProviderButtons({ variant = "outline" }: EmailProviderButtonsProps) {
  const openGmail = () => {
    window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
  };

  const openOutlook = () => {
    window.open('https://outlook.live.com', '_blank', 'noopener,noreferrer');
  };

  if (variant === "gradient") {
    return (
      <div className="flex flex-col gap-3">
        <Button
          onClick={openGmail}
          className="w-full bg-gradient-to-r from-[#6b21a8] via-[#2563eb] to-[#10b981] hover:opacity-90 text-white gap-2"
          size="lg"
        >
          Open Gmail
          <ExternalLink className="w-4 h-4" />
        </Button>
        <Button
          onClick={openOutlook}
          variant="outline"
          className="w-full gap-2"
          size="lg"
        >
          Open Outlook
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        onClick={openGmail}
        variant="outline"
        className="flex-1 gap-2 hover:opacity-80 transition-opacity"
        size="lg"
      >
        Open Gmail
        <ExternalLink className="w-4 h-4" />
      </Button>
      <Button
        onClick={openOutlook}
        variant="outline"
        className="flex-1 gap-2 hover:opacity-80 transition-opacity"
        size="lg"
      >
        Open Outlook
        <ExternalLink className="w-4 h-4" />
      </Button>
    </div>
  );
}
