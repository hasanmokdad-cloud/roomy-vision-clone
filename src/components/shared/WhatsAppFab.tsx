import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/96181858026"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 hover-scale"
    >
      <Button
        size="lg"
        className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>
    </a>
  );
}
