import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { encodeForWhatsApp } from '@/utils/inputValidation';

interface SecureContactButtonProps {
  dormName: string;
  phoneNumber?: string;
  className?: string;
}

/**
 * Secure contact button that doesn't expose owner phone numbers
 * Uses backend to fetch contact info when needed
 */
export const SecureContactButton = ({ 
  dormName, 
  phoneNumber,
  className 
}: SecureContactButtonProps) => {
  const handleContact = () => {
    if (!phoneNumber) {
      return;
    }

    // Sanitize and encode the message
    const message = encodeForWhatsApp(`Hi! I'm interested in ${dormName}. Is it still available?`);
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Open WhatsApp with safe URL
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  if (!phoneNumber) {
    return null;
  }

  return (
    <Button
      onClick={handleContact}
      className={className}
      variant="default"
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      Contact via WhatsApp
    </Button>
  );
};
