import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageSquare, Bookmark, Share2, MapPin, DollarSign, Users, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CompatibilityChart } from '@/components/match/CompatibilityChart';
import { MatchReasonsBadges } from '@/components/match/MatchReasonsBadges';
import { computeSimilarity } from '@/hooks/useRoommateMatch';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import { useIsMobile } from '@/hooks/use-mobile';

export default function RoommateProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [matchScore, setMatchScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, [userId]);

  const loadProfiles = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load my profile
      const { data: myProfileData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setMyProfile(myProfileData);

      // Load target profile
      const { data: profileData } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileData) {
        toast({
          title: 'Error',
          description: 'Profile not found',
          variant: 'destructive',
        });
        navigate('/ai-match');
        return;
      }

      setProfile(profileData);

      // Calculate compatibility
      if (myProfileData && profileData) {
        const score = computeSimilarity(myProfileData, profileData);
        setMatchScore(score);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('saved_items').insert({
        user_id: user.id,
        item_id: profile.user_id,
        item_type: 'roommate',
      });

      toast({
        title: 'Success',
        description: 'Added to favorites',
      });
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const shareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Success',
      description: 'Profile link copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60">Profile not found</p>
      </div>
    );
  }

  return (
    <>
      {!isMobile && <Navbar />}
      <div className="min-h-screen pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Back Button */}
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-hover rounded-3xl p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-32 h-32 border-4 border-primary/20">
                <AvatarImage src={profile.profile_photo_url} />
                <AvatarFallback className="text-3xl">
                  {profile.full_name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                  <Badge className="text-lg px-3 py-1 bg-gradient-to-r from-primary to-secondary">
                    {matchScore}% Match
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-4 text-foreground/60 mb-4">
                  {profile.age && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {profile.age} years old
                    </span>
                  )}
                  {profile.university && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.university}
                    </span>
                  )}
                  {profile.gender && (
                    <span>{profile.gender}</span>
                  )}
                </div>

                {/* Match Reasons */}
                {myProfile && (
                  <MatchReasonsBadges profileA={myProfile} profileB={profile} />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={saveFavorite}>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={shareProfile}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preferences Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-hover h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Housing Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile.budget && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Budget</p>
                      <p className="font-semibold flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${profile.budget}/month
                      </p>
                    </div>
                  )}

                  {profile.favorite_areas && profile.favorite_areas.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-2">Preferred Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.favorite_areas.map((area: string) => (
                          <Badge key={area} variant="secondary">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.preferred_room_types && profile.preferred_room_types.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-2">Room Types</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferred_room_types.map((type: string) => (
                          <Badge key={type} variant="secondary">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.preferred_amenities && profile.preferred_amenities.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferred_amenities.slice(0, 6).map((amenity: string) => (
                          <Badge key={amenity} variant="outline">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.preferred_university && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Preferred University</p>
                      <p className="font-semibold">{profile.preferred_university}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Compatibility Chart */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-hover h-full">
                <CardHeader>
                  <CardTitle>Compatibility Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {myProfile && (
                    <CompatibilityChart profileA={myProfile} profileB={profile} />
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Info */}
          {profile.residential_area && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6"
            >
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/60 mb-1">Current Residential Area</p>
                  <p className="font-semibold">{profile.residential_area}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
