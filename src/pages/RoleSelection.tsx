// src/pages/RoleSelection.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap, Building2, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function RoleSelection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/auth", { replace: true });
        return;
      }

      const user = session.user;
      const defaultAdminEmails = [
        "hassan.mokdad01@lau.edu",
        "hasan.mokdad@aiesec.net",
      ];

      // Check if user already has a role
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("roles(name)")
        .eq("user_id", user.id)
        .maybeSingle();

      const roleName = roleRow?.roles?.name as
        | "admin"
        | "owner"
        | "student"
        | undefined;

      // If user already has a role, redirect to appropriate dashboard
      if (roleName === "admin" || defaultAdminEmails.includes(user.email ?? "")) {
        navigate("/admin", { replace: true });
        return;
      }
      
      if (roleName === "owner") {
        navigate("/owner", { replace: true });
        return;
      }
      
      if (roleName === "student") {
        navigate("/dashboard", { replace: true });
        return;
      }

      // No role yet - check email verification and show role selection
      setEmailVerified(!!session.user.email_confirmed_at);
      setUserEmail(session.user.email || "");
      setLoading(false);
    };

    void checkRoleAndRedirect();
  }, [navigate]);

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/intro`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification email sent",
          description: "Check your inbox for the verification link.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to resend verification email",
        variant: "destructive",
      });
    }
  };

  const assignRole = async (chosen_role: "student" | "owner") => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    setSaving(true);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ chosen_role }),
        }
      );

      const result = await resp.json();

      // Handle 409 - user already has a different role
      if (resp.status === 409) {
        toast({
          title: "Role already assigned",
          description: `You are already registered as ${result.role}. Redirecting...`,
        });
        
        // Redirect to their existing role's dashboard
        if (result.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (result.role === "owner") {
          navigate("/owner", { replace: true });
        } else if (result.role === "student") {
          navigate("/dashboard", { replace: true });
        }
        return;
      }

      if (!resp.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to assign role",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      // On success, go to the appropriate dashboard
      if (chosen_role === "student") {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/owner", { replace: true });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong while assigning your role.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-emerald-700">
        <Loader2 className="w-10 h-10 text-emerald-300 animate-spin" />
      </div>
    );
  }

  // Show email verification gate if email not verified
  if (!loading && !emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-emerald-700 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-yellow-400/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-yellow-300" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">
            Verify Your Email
          </h1>
          <p className="text-white/80 mb-6">
            Before you can select your role and start using Roomy, please verify
            your email address.
          </p>
          <p className="text-white/70 text-sm mb-6">
            We sent a verification link to{" "}
            <span className="font-semibold text-emerald-300">{userEmail}</span>
          </p>
          <Button
            onClick={handleResendVerification}
            className="w-full bg-gradient-to-r from-emerald-400 to-blue-500 text-white hover:opacity-90"
          >
            Resend Verification Email
          </Button>
          <p className="mt-6 text-xs text-white/50">
            After verifying, refresh this page to continue.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-emerald-700 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 text-center"
      >
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
          How will you use <span className="text-emerald-300">Roomy</span>?
        </h1>
        <p className="text-white/80 mb-8">
          Choose the option that best describes you so we can set up the right
          dashboard and experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            disabled={saving || !emailVerified}
            onClick={() => {
              if (!emailVerified) {
                toast({
                  title: "Email verification required",
                  description:
                    "Please verify your email before selecting a role.",
                  variant: "destructive",
                });
                return;
              }
              void assignRole("student");
            }}
            className="group rounded-2xl border border-white/20 bg-white/5 hover:bg-emerald-500/10 px-4 py-6 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(45,212,191,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-400/20 flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-emerald-300" />
            </div>
            <h2 className="text-xl font-semibold text-white">I'm a Student</h2>
            <p className="text-sm text-white/70">
              Get personalized dorm recommendations, AI roommate matching, and a
              student dashboard with saved dorms and messages.
            </p>
          </button>

          <button
            disabled={saving || !emailVerified}
            onClick={() => {
              if (!emailVerified) {
                toast({
                  title: "Email verification required",
                  description:
                    "Please verify your email before selecting a role.",
                  variant: "destructive",
                });
                return;
              }
              void assignRole("owner");
            }}
            className="group rounded-2xl border border-white/20 bg-white/5 hover:bg-blue-500/10 px-4 py-6 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(59,130,246,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <div className="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-blue-300" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              I'm a Dorm Owner
            </h2>
            <p className="text-sm text-white/70">
              Manage your dorm listings, rooms, availability, bookings,
              messages, and performance in one place with owner tools.
            </p>
          </button>
        </div>

        <p className="mt-6 text-xs text-white/50">
          You can always contact an admin if your role needs to be changed
          later.
        </p>
      </motion.div>
    </div>
  );
}
