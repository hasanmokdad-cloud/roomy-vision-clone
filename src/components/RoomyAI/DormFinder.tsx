import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { DormCard } from './DormCard';

interface DormFinderProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const DormFinder = ({ isOpen, onClose, userId }: DormFinderProps) => {
  const [step, setStep] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    university: '',
    budget: '',
    gender: '',
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSearch();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRestart = () => {
    setStep(1);
    setResults([]);
    setFormData({ university: '', budget: '', gender: '' });
  };

  const handleSearch = async () => {
    setIsSearching(true);
    
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let query = supabase.from('dorms').select('*').eq('available', true);

    if (formData.university) {
      query = query.eq('university', formData.university);
    }
    if (formData.budget) {
      query = query.lte('price', parseFloat(formData.budget));
    }
    if (formData.gender) {
      query = query.eq('gender_preference', formData.gender);
    }

    const { data, error } = await query;

    if (!error && data) {
      setResults(data);
    }

    setIsSearching(false);
  };

  const logDormInteraction = async (dormId: string, action: string) => {
    await supabase.from('ai_recommendations_log').insert({
      user_id: userId,
      dorm_id: dormId,
      action,
    });
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
            className="glass-hover rounded-3xl w-full max-w-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step > 1 && !isSearching && results.length === 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="rounded-full hover:bg-white/10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                <div>
                  <h2 className="text-2xl font-bold gradient-text">Find Your Perfect Dorm</h2>
                  {!isSearching && results.length === 0 && (
                    <p className="text-xs text-foreground/60 mt-1">Step {step} of 3</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isSearching ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center animate-pulse">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold gradient-text">
                      Let Roomy AI Do the Work ✨
                    </h3>
                    <p className="text-foreground/60">
                      Analyzing your preferences and finding the best matches...
                    </p>
                  </div>
                  <div className="max-w-md mx-auto">
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                      />
                    </div>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold gradient-text">
                      We found {results.length} perfect {results.length === 1 ? 'dorm' : 'dorms'} for you! 🎉
                    </h3>
                    <p className="text-sm text-foreground/60">
                      Based on your preferences
                    </p>
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {results.map((dorm) => (
                      <DormCard
                        key={dorm.id}
                        dorm={dorm}
                        onViewDetails={() => logDormInteraction(dorm.id, 'viewed')}
                      />
                    ))}
                  </div>
                  <Button
                    onClick={handleRestart}
                    variant="outline"
                    className="w-full glass border-white/10 hover:bg-white/10"
                  >
                    Search Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>Which university are you attending?</Label>
                        <Select
                          value={formData.university}
                          onValueChange={(value) => setFormData({ ...formData, university: value })}
                        >
                          <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue placeholder="Select university" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LAU">Lebanese American University (LAU)</SelectItem>
                            <SelectItem value="USEK">Holy Spirit University of Kaslik (USEK)</SelectItem>
                            <SelectItem value="NDU">Notre Dame University (NDU)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>What's your monthly budget?</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 500"
                          value={formData.budget}
                          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                          className="bg-black/20 border-white/10"
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label>Gender preference</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        >
                          <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue placeholder="Select preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male only</SelectItem>
                            <SelectItem value="female">Female only</SelectItem>
                            <SelectItem value="mixed">Mixed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    onClick={handleNext}
                    className="w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-6 rounded-xl hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                  >
                    {step === 3 ? 'Find My Dorm' : 'Continue'}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};