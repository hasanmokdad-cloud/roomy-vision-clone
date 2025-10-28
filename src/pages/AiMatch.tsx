import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { UnderwaterScene } from '@/components/UnderwaterScene';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DormCard from '@/components/shared/DormCard';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useAuthGuard, useProfileCompletion } from '@/hooks/useAuthGuard';

const universities = [
  'LAU (Byblos)',
  'LAU (Beirut)',
  'AUB',
  'USEK',
  'USJ',
  'LU (Hadat)',
  'Balamand (Dekwaneh)',
  'Balamand (ALBA)',
  'BAU',
  'Haigazian'
];

export default function AiMatch() {
  const { loading: authLoading, userId } = useAuthGuard();
  const { checkingProfile } = useProfileCompletion(userId);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    age: '',
    gender: '',
    university: '',
    residential_area: '',
  });

  const [preferences, setPreferences] = useState({
    room_type: '',
    roommate_needed: false,
    budget: 1000,
    preferred_university: '',
    distance_preference: 'No preference',
  });

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          university: data.university || '',
          residential_area: data.residential_area || '',
        });
        setPreferences({
          room_type: data.room_type || '',
          roommate_needed: data.roommate_needed || false,
          budget: data.budget || 1000,
          preferred_university: data.preferred_university || '',
          distance_preference: data.distance_preference || 'No preference',
        });
      }
    };

    loadProfile();
  }, [userId]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile.full_name || !profile.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Upsert student profile
    const studentData = {
      user_id: userId,
      full_name: profile.full_name,
      email: profile.email,
      age: profile.age ? parseInt(profile.age) : null,
      gender: profile.gender,
      university: profile.university,
      residential_area: profile.residential_area,
    };

    const { error } = await supabase
      .from('students')
      .upsert(studentData, { onConflict: userId ? 'user_id' : 'email' });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile',
        variant: 'destructive'
      });
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update student preferences
    const { error } = await supabase
      .from('students')
      .update({
        room_type: preferences.room_type,
        roommate_needed: preferences.roommate_needed,
        budget: preferences.budget,
        preferred_university: preferences.preferred_university,
        distance_preference: preferences.distance_preference,
      })
      .eq('email', profile.email);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive'
      });
      return;
    }

    setStep(3);
    findMatches();
  };

  const findMatches = async () => {
    setLoading(true);
    
    let query = supabase
      .from('dorms')
      .select('*')
      .eq('verification_status', 'Verified')
      .lte('monthly_price', preferences.budget);

    if (preferences.preferred_university) {
      query = query.eq('university', preferences.preferred_university);
    }

    if (preferences.room_type) {
      query = query.ilike('room_types', `%${preferences.room_type}%`);
    }

    const { data, error } = await query.order('monthly_price', { ascending: true }).limit(3);

    setLoading(false);

    if (!error && data) {
      setMatches(data);
    } else {
      setMatches([]);
    }
  };

  const restart = () => {
    setStep(1);
    setMatches([]);
  };

  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <UnderwaterScene />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 mt-20">
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <Badge variant="secondary" className="mb-4 neon-glow">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Matching
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black gradient-text mb-6">
              Find Your Perfect Dorm
            </h1>
            <p className="text-xl text-foreground/80">
              Answer a few quick questions and let AI do the work
            </p>
          </motion.div>

          <Progress value={progress} className="mb-8" />

          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass-hover rounded-3xl p-10 neon-border"
            >
              <h2 className="text-3xl font-black mb-8 gradient-text">Step 1 — Create your profile</h2>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      required
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>University</Label>
                    <Select value={profile.university} onValueChange={(v) => setProfile({ ...profile, university: v })}>
                      <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Residential Area</Label>
                    <Input
                      value={profile.residential_area}
                      onChange={(e) => setProfile({ ...profile, residential_area: e.target.value })}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-secondary">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass-hover rounded-3xl p-10 neon-border"
            >
              <h2 className="text-3xl font-black mb-8 gradient-text">Step 2 — Set your preferences</h2>
              <form onSubmit={handleStep2Submit} className="space-y-6">
                <div>
                  <Label>Room Type</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {['Private Room', 'Shared Room', 'Studio Apartment'].map(type => (
                      <Button
                        key={type}
                        type="button"
                        variant={preferences.room_type === type ? 'default' : 'outline'}
                        onClick={() => setPreferences({ ...preferences, room_type: type })}
                        className="h-auto py-3"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 glass rounded-xl">
                  <div>
                    <Label>Roommate Needed?</Label>
                    <p className="text-sm text-foreground/60">Looking for a compatible roommate</p>
                  </div>
                  <Switch
                    checked={preferences.roommate_needed}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, roommate_needed: checked })}
                  />
                </div>

                <div>
                  <Label>Budget: ${preferences.budget} / month</Label>
                  <Slider
                    value={[preferences.budget]}
                    onValueChange={([v]) => setPreferences({ ...preferences, budget: v })}
                    min={0}
                    max={2000}
                    step={50}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Preferred University</Label>
                  <Select 
                    value={preferences.preferred_university} 
                    onValueChange={(v) => setPreferences({ ...preferences, preferred_university: v })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map(u => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Distance Preference</Label>
                  <Select 
                    value={preferences.distance_preference} 
                    onValueChange={(v) => setPreferences({ ...preferences, distance_preference: v })}
                  >
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Walking distance">Walking distance</SelectItem>
                      <SelectItem value="Shuttle OK">Shuttle OK</SelectItem>
                      <SelectItem value="No preference">No preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-secondary">
                    Find Matches <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center glass-hover rounded-3xl p-10 neon-border"
              >
                <h2 className="text-3xl font-black mb-4 gradient-text">
                  {loading ? 'Finding your perfect match...' : 'Your Matches'}
                </h2>
                {!loading && matches.length === 0 && (
                  <p className="text-foreground/60">
                    No matches found. Try adjusting your preferences.
                  </p>
                )}
              </motion.div>

              {!loading && matches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {matches.map((dorm, idx) => (
                    <div 
                      key={dorm.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <DormCard dorm={dorm} />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button variant="outline" onClick={restart} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" /> Restart
                </Button>
                <Button onClick={() => navigate('/listings')} className="flex-1 bg-gradient-to-r from-primary to-secondary">
                  Browse All Dorms
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
