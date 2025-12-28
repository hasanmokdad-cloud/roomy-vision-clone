import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, MapPin, GraduationCap, DollarSign, Home, Users, Calendar, Loader2, ArrowLeft } from "lucide-react";
import { AddFriendButton } from "@/components/friends/AddFriendButton";
import { RoomyNavbar } from "@/components/RoomyNavbar";
import Footer from "@/components/shared/Footer";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { SubPageHeader } from "@/components/mobile/SubPageHeader";
import { SwipeBackWrapper } from "@/components/mobile/SwipeBackWrapper";

export default function StudentProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [student, setStudent] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const matchScore = location.state?.matchScore;

  // Fetch current user's student ID
  useEffect(() => {
    const fetchCurrentStudent = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: currentStudent } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (currentStudent) {
          setCurrentStudentId(currentStudent.id);
        }
      }
    };
    fetchCurrentStudent();
  }, []);

  useEffect(() => {
    loadStudentProfile();
  }, [id]);

  const loadStudentProfile = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // First try matching by user_id
      let { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();

      // Fallback: try matching by student table id
      if (!studentData) {
        const { data: fallbackData } = await supabase
          .from("students")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        studentData = fallbackData;
      }

      if (studentData) {
        setStudent(studentData);

        const { data: prefData } = await supabase
          .from("user_preferences")
          .select("preferences")
          .eq("user_id", studentData.user_id)
          .maybeSingle();

        if (prefData) {
          setPreferences(prefData.preferences);
        }
      }
    } catch (error) {
      console.error("Error loading student profile:", error);
      toast({
        title: "Error",
        description: "Failed to load student profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    navigate("/messages", {
      state: {
        openThreadWithUserId: student.user_id,
        initialMessage: "Hi! I think we might be good roommates based on our match.",
        matchProfile: student,
      },
    });
  };

  const getLocationDisplay = () => {
    const parts = [student?.town_village, student?.district, student?.governorate].filter(Boolean);
    return parts.join(', ') || null;
  };

  // Profile field row component for consistent styling
  const ProfileRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-4 py-4 border-b border-border last:border-b-0">
        <div className="text-muted-foreground">{icon}</div>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="font-medium">{value}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {!isMobile && <RoomyNavbar />}
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Student not found</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <SwipeBackWrapper>
      <div className="min-h-screen flex flex-col bg-background">
        {isMobile && <SubPageHeader title="View Profile" />}
        {!isMobile && <RoomyNavbar />}

        <main className={`flex-1 ${isMobile ? 'pt-14' : ''}`}>
        <div className="grid lg:grid-cols-[320px_1fr] min-h-[calc(100vh-120px)] lg:min-h-[calc(100vh-80px)] lg:mt-16">
          {/* Left Side - Profile Photo */}
          <div className="p-6 lg:p-12 flex flex-col items-center justify-start lg:justify-center lg:border-r border-border">
            <Avatar className="w-40 h-40 lg:w-52 lg:h-52 ring-4 ring-border/30">
              <AvatarImage src={student.profile_photo_url || undefined} alt={student.full_name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-4xl lg:text-5xl">
                {student.full_name?.charAt(0).toUpperCase() || "S"}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="mt-6 text-2xl lg:text-3xl font-semibold text-center">{student.full_name}</h1>
            
            {matchScore && (
              <div className="mt-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {matchScore}% Match
              </div>
            )}

            <Button onClick={handleMessage} className="mt-6 w-full max-w-[200px]">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message
            </Button>
            
            {/* Add Friend Button */}
            {currentStudentId && student.id && currentStudentId !== student.id && (
              <AddFriendButton 
                currentStudentId={currentStudentId}
                targetStudentId={student.id}
                className="mt-2 w-full max-w-[200px]"
              />
            )}

            {/* Back Button */}
            <Button 
              onClick={() => navigate(-1)} 
              variant="outline" 
              className="mt-2 w-full max-w-[200px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Right Side - Profile Details */}
          <div className="p-6 lg:p-12">
            <h2 className="text-xl font-semibold mb-6 hidden lg:block">View Profile</h2>

            {/* Personal Info */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Personal Info</h3>
              <div className="bg-card rounded-lg border border-border p-4">
                <ProfileRow 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Age" 
                  value={student.age ? `${student.age} years old` : null} 
                />
                <ProfileRow 
                  icon={<Users className="w-5 h-5" />} 
                  label="Gender" 
                  value={student.gender} 
                />
                <ProfileRow 
                  icon={<MapPin className="w-5 h-5" />} 
                  label="Home Location" 
                  value={getLocationDisplay()} 
                />
              </div>
            </div>

            {/* Academic Info */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Academic Info</h3>
              <div className="bg-card rounded-lg border border-border p-4">
                <ProfileRow 
                  icon={<GraduationCap className="w-5 h-5" />} 
                  label="University" 
                  value={student.university} 
                />
                <ProfileRow 
                  icon={<GraduationCap className="w-5 h-5" />} 
                  label="Major" 
                  value={student.major} 
                />
                <ProfileRow 
                  icon={<Calendar className="w-5 h-5" />} 
                  label="Year of Study" 
                  value={student.year_of_study ? `Year ${student.year_of_study}` : null} 
                />
              </div>
            </div>

            {/* Housing Preferences */}
            {(student.budget || student.preferred_city || student.room_type) && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Housing Preferences</h3>
                <div className="bg-card rounded-lg border border-border p-4">
                  <ProfileRow 
                    icon={<DollarSign className="w-5 h-5" />} 
                    label="Budget" 
                    value={student.budget ? `$${student.budget}/month` : null} 
                  />
                  <ProfileRow 
                    icon={<MapPin className="w-5 h-5" />} 
                    label="Preferred Location" 
                    value={student.preferred_city ? 
                      (student.preferred_areas?.length 
                        ? `${student.preferred_city} · ${student.preferred_areas.slice(0, 2).join(', ')}${student.preferred_areas.length > 2 ? ` +${student.preferred_areas.length - 2}` : ''}`
                        : student.preferred_city) 
                      : null
                    } 
                  />
                  <ProfileRow 
                    icon={<Home className="w-5 h-5" />} 
                    label="Room Type" 
                    value={student.room_type} 
                  />
                </div>
              </div>
            )}

            {/* Additional Preferences */}
            {preferences && Object.keys(preferences).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Additional Preferences</h3>
                <div className="bg-card rounded-lg border border-border p-4">
                  {Object.entries(preferences).map(([key, value], index) => (
                    <div key={index} className="flex items-center gap-4 py-3 border-b border-border last:border-b-0">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="font-medium">{String(value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </main>

        <Footer />
      </div>
    </SwipeBackWrapper>
  );
}
