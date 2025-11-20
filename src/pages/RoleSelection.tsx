// src/pages/RoleSelection.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap, Building2 } from "lucide-react";
import { motion } from "framer-motion";

type AppRole = "admin" | "owner" | "student";

export default function RoleSelection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/auth");
        return;
      }

      const { data: roles, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .limit(1);

      if (roleError) {
        console.error("Error loading user role:", roleError);
        setLoading(false);
        return;
      }

      const existingRole = roles?.[0]?.role as AppRole | undefined;

      if (existingRole) {
        if (existingRole === "admin") {
          navigate("/admin", { replace: true });
        } else if (existingRole === "owner") {
          navigate("/owner", { replace: true });
        } else if (existingRole === "student") {
          navigate("/dashboard", { replace: true });
        }
        return;
      }

      setLoading(false);
    };

    init();
  }, [navigate]);

  const handleSelectRole = async (role: AppRole) => {
    setSaving(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("user_roles").upsert([
      {
        user_id: session.user.id,
        role,
      }
    ], {
      onConflict: "user_id",
    });

    if (error) {
      console.error("Error saving role:", error);
      alert("Failed to save your role. Please try again.");
      setSaving(false);
      return;
    }

    if (role === "owner") {
      navigate("/owner", { replace: true });
    } else if (role === "admin") {
      navigate("/admin", { replace: true });
    } else if (role === "student") {
      navigate("/dashboard", { replace: true });
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-emerald-700">
        <Loader2 className="w-10 h-10 text-emerald-300 animate-spin" />
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
            disabled={saving}
            onClick={() => handleSelectRole("student")}
            className="group rounded-2xl border border-white/20 bg-white/5 hover:bg-emerald-500/10 px-4 py-6 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(45,212,191,0.45)]"
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
            disabled={saving}
            onClick={() => handleSelectRole("owner")}
            className="group rounded-2xl border border-white/20 bg-white/5 hover:bg-blue-500/10 px-4 py-6 flex flex-col items-center justify-center gap-3 transition-all hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(59,130,246,0.45)]"
          >
            <div className="w-12 h-12 rounded-full bg-blue-400/20 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-blue-300" />
            </div>
            <h2 className="text-xl font-semibold text-white">I'm a Dorm Owner</h2>
            <p className="text-sm text-white/70">
              Manage your dorm listings, rooms, availability, bookings,
              messages, and performance in one place with owner tools.
            </p>
          </button>
        </div>

        <p className="mt-6 text-xs text-white/50">
          You can always contact an admin if your role needs to be changed later.
        </p>
      </motion.div>
    </div>
  );
}
