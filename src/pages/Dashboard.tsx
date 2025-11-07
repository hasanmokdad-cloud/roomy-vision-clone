import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { RoomyAI } from '@/components/RoomyAI';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Button } from '@/components/ui/button';
import { User, LogOut, Home, MessageSquare, Search, Award, Eye, TrendingUp, CheckCircle } from 'lucide-react';
import { FluidBackground } from '@/components/FluidBackground';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfileCompletion } from '@/hooks/useAuthGuard';
import { SkipToContent } from '@/components/SkipToContent';

interface DormPreview {
  id: string;
  dorm_name: string;
  monthly_price: number;
  cover_image?: string;
  area: string;
}

export default function Dashboard() {
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [inquiriesCount, setInquiriesCount] = useState(0);
  const [viewedDormsCount, setViewedDormsCount] = useState(0);
  const [recentDorms, setRecentDorms] = useState<DormPreview[]>([]);
  const navigate = useNavigate();

  const { checkingProfile, isProfileComplete, completionPercentage } = useProfileCompletion(userId);

  useEffect(() => {
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUserId(session.user.id);

    // Get student profile
    const { data: studentData } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (studentData) {
      setUserName(studentData.full_name);
      setStudentId(studentData.id);

      // Get inquiries count
      const { count } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentData.id);

      setInquiriesCount(count || 0);
    }

    // Get viewed dorms from localStorage
    const viewedDormIds = JSON.parse(localStorage.getItem('viewed_dorms') || '[]');
    setViewedDormsCount(viewedDormIds.length);

    // Fetch recent dorms
    if (viewedDormIds.length > 0) {
      const { data: dormsData } = await supabase
        .from('dorms_public')
        .select('id, dorm_name, monthly_price, cover_image, area')
        .in('id', viewedDormIds.slice(0, 5));

      if (dormsData) {
        setRecentDorms(dormsData);
      }
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/intro');
  };

  return (
    <div className="min-h-screen relative">
      <SkipToContent />
      <FluidBackground />
      
      <nav className="absolute top-6 right-6 z-50 flex gap-2" role="navigation" aria-label="Dashboard navigation">
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="glass hover:bg-white/10 gap-2"
        >
          <Home className="w-4 h-4" />
          Home
        </Button>
        <Button
          onClick={() => navigate('/profile')}
          variant="ghost"
          className="glass hover:bg-white/10 gap-2"
        >
          <User className="w-4 h-4" />
          Profile
        </Button>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="glass hover:bg-white/10 gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </nav>

      <RoomyAI />
      <WhatsAppButton />
      
      <div className="container mx-auto px-6 py-20 relative z-10">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4">
            Welcome{userName && `, ${userName}`}! 👋
          </h1>
          <p className="text-xl text-foreground/60 max-w-2xl mx-auto">
            Your AI-powered student housing dashboard
          </p>
        </div>

        {loading || checkingProfile ? (
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Profile Completion Widget */}
            {!isProfileComplete && (
              <Card className="glass-hover border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">Complete Your Profile</h3>
                        <Badge variant="secondary">{Math.round(completionPercentage)}%</Badge>
                      </div>
                      <p className="text-sm text-foreground/60 mb-4">
                        Complete your profile to get better AI recommendations
                      </p>
                      <Progress value={completionPercentage} className="mb-4" />
                      <Button 
                        onClick={() => navigate('/profile')}
                        className="bg-gradient-to-r from-primary to-secondary"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="glass-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary">{inquiriesCount}</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{inquiriesCount}</h3>
                  <p className="text-sm text-foreground/60">Inquiries Sent</p>
                </CardContent>
              </Card>

              <Card className="glass-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary">{viewedDormsCount}</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{viewedDormsCount}</h3>
                  <p className="text-sm text-foreground/60">Dorms Viewed</p>
                </CardContent>
              </Card>

              <Card className="glass-hover">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="secondary">{Math.round(completionPercentage)}%</Badge>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">Profile Strength</h3>
                  <p className="text-sm text-foreground/60">
                    {isProfileComplete ? 'Excellent!' : 'Good Progress'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Viewed Dorms */}
            {recentDorms.length > 0 && (
              <Card className="glass-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Recently Viewed Dorms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentDorms.map((dorm) => (
                      <div
                        key={dorm.id}
                        onClick={() => navigate(`/dorm/${dorm.id}`)}
                        className="glass-hover rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform"
                      >
                        {dorm.cover_image ? (
                          <img
                            src={dorm.cover_image}
                            alt={dorm.dorm_name}
                            loading="lazy"
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-3 flex items-center justify-center">
                            <Home className="w-8 h-8 text-foreground/40" />
                          </div>
                        )}
                        <h4 className="font-bold truncate mb-1">{dorm.dorm_name}</h4>
                        <p className="text-sm text-foreground/60 truncate mb-2">{dorm.area}</p>
                        <div className="text-lg font-bold gradient-text">${dorm.monthly_price}/mo</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-hover rounded-2xl p-6 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Chat with Roomy AI</h3>
                <p className="text-foreground/60 text-sm mb-4">
                  Get instant recommendations and personalized dorm suggestions
                </p>
                <p className="text-xs text-primary font-semibold">
                  Click the AI button in the bottom right →
                </p>
              </div>
              
              <div className="glass-hover rounded-2xl p-6 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Browse Listings</h3>
                <p className="text-foreground/60 text-sm mb-4">
                  Explore all verified dorms with advanced filters
                </p>
                <Button 
                  onClick={() => navigate('/listings')}
                  variant="outline"
                  className="w-full"
                >
                  View Listings
                </Button>
              </div>
              
              <div className="glass-hover rounded-2xl p-6 text-left">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4 flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI Match</h3>
                <p className="text-foreground/60 text-sm mb-4">
                  Let AI find your perfect dorm match based on your preferences
                </p>
                <Button 
                  onClick={() => navigate('/ai-match')}
                  variant="outline"
                  className="w-full"
                >
                  Find Matches
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
