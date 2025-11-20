import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, User, Heart, MapPin, GraduationCap, DollarSign } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { useToast } from "@/hooks/use-toast";

export default function StudentProfile() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const matchScore = location.state?.matchScore;

  useEffect(() => {
    loadStudentProfile();
  }, [id]);

  const loadStudentProfile = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single();

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-foreground/60">Student not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Navbar />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header Card */}
          <Card className="mb-6 shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-white">
                    {student.full_name?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold gradient-text mb-2">
                    {student.full_name}
                  </h1>
                  {matchScore && (
                    <Badge className="mb-2 bg-gradient-to-r from-green-500 to-emerald-400">
                      {matchScore}% Match
                    </Badge>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                    {student.university && (
                      <Badge variant="outline">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {student.university}
                      </Badge>
                    )}
                    {student.age && (
                      <Badge variant="outline">
                        <User className="w-3 h-3 mr-1" />
                        {student.age} years old
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleMessage}
                  className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preferences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Living Preferences */}
            <Card className="shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Living Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-foreground/60" />
                    <span className="text-sm">Budget: ${student.budget}/month</span>
                  </div>
                )}
                {student.room_type && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-foreground/60" />
                    <span className="text-sm">Room Type: {student.room_type}</span>
                  </div>
                )}
                {student.residential_area && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-foreground/60" />
                    <span className="text-sm">Preferred Area: {student.residential_area}</span>
                  </div>
                )}
                {student.roommate_needed !== null && (
                  <Badge variant={student.roommate_needed ? "default" : "secondary"}>
                    {student.roommate_needed ? "Looking for roommate" : "No roommate needed"}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            {preferences && (
              <Card className="shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(preferences).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-foreground/80">{key}: </span>
                      <span className="text-foreground/60">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
