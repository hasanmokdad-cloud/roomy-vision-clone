import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthRequiredModal = ({ isOpen, onClose }: AuthRequiredModalProps) => {
  const { openAuthModal } = useAuth();

  const handleSignIn = () => {
    onClose();
    openAuthModal();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-hover rounded-3xl p-8 max-w-md w-full text-center space-y-6"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold gradient-text">
                Create your Roomy account to get personalized AI recommendations ✨
              </h2>
              <p className="text-foreground/60">
                Sign up or log in to access Roomy AI and find your perfect dorm match.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleSignIn}
                className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-6 rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
              >
                Sign Up / Log In
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full hover:bg-white/10"
              >
                Maybe Later
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};