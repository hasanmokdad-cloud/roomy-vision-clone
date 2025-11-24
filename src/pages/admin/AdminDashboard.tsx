// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Building2,
  CheckCircle2,
  ShieldAlert,
  Home,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  Key,
  MessageSquare,
} from "lucide-react";

export default function AdminDashboard() {
  const { loading } = useRoleGuard("admin");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    students: 0,
    owners: 0,
    dorms: 0,
    pendingDorms: 0,
  });
  const [pendingList, setPendingList] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      // Count students
      const { count: studentCount } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true });
      
      // Count owners
      const { count: ownerCount } = await supabase
        .from("owners")
        .select("id", { count: "exact", head: true });
      
      // Count ONLY VERIFIED dorms
      const { count: verifiedDormCount } = await supabase
        .from("dorms")
        .select("id", { count: "exact", head: true })
        .eq("verification_status", "Verified");
      
      // Count pending dorms
      const { data: pendingDorms, count: pendingCount } = await supabase
        .from("dorms")
        .select("*", { count: "exact" })
        .eq("verification_status", "Pending");

      setStats({
        students: studentCount || 0,
        owners: ownerCount || 0,
        dorms: verifiedDormCount || 0,
        pendingDorms: pendingCount || 0,
      });
      setPendingList(pendingDorms || []);
    };

    loadStats();

    // Set up real-time subscriptions
    const studentsChannel = supabase
      .channel('admin-students-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        () => loadStats()
      )
      .subscribe();

    const ownersChannel = supabase
      .channel('admin-owners-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'owners' },
        () => loadStats()
      )
      .subscribe();

    const dormsChannel = supabase
      .channel('admin-dorms-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dorms' },
        () => loadStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(ownersChannel);
      supabase.removeChannel(dormsChannel);
    };
  }, []);

  const verifyDorm = async (id: string) => {
    try {
      console.log('🔍 [AdminDashboard] Starting verification for dorm:', id);
      
      const { data, error } = await supabase.rpc('admin_update_verification_status', {
        p_dorm_id: id,
        p_new_status: 'Verified'
      });

      if (error) {
        console.error('❌ [AdminDashboard] RPC Error:', error);
        toast({
          title: 'Verification Failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ [AdminDashboard] Success!', data);
      
      // Update both pending and verified counts
      setPendingList((prev) => prev.filter((d) => d.id !== id));
      setStats(prev => ({ 
        ...prev, 
        pendingDorms: Math.max(0, prev.pendingDorms - 1),
        dorms: prev.dorms + 1  // Increment verified count
      }));
      
      toast({
        title: 'Success',
        description: 'Dorm verified successfully',
      });
    } catch (error: any) {
      console.error('❌ [AdminDashboard] Unexpected Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify dorm',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold gradient-text">Admin Panel</h2>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-12 py-16 space-y-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground/70 mb-2">
            Welcome Back, CEO
          </h2>
          <h1 className="text-5xl font-extrabold gradient-text">
            Admin Control Panel
          </h1>
          <p className="text-foreground/70 mt-2">
            Manage users, monitor listings, and verify dorms.
          </p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.students}</p>
              <p className="text-sm text-foreground/60">Active profiles</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-500" /> Owners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.owners}</p>
              <p className="text-sm text-foreground/60">
                Registered property owners
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-purple-500" /> Dorms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.dorms}</p>
              <p className="text-sm text-foreground/60">Listed properties</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-500" /> Pending
                Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.pendingDorms}</p>
              <p className="text-sm text-foreground/60">Awaiting review</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Verification Section */}
        <Card className="shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Dorms Pending
              Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pendingList.map((dorm, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl border border-muted bg-white dark:bg-gray-900 shadow-md overflow-hidden"
                  >
                    <img
                      src={dorm.cover_image || dorm.image_url || "/placeholder.svg"}
                      alt={dorm.dorm_name || dorm.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {dorm.dorm_name || dorm.name}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {dorm.address || dorm.location}
                      </p>
                      <Button
                        onClick={() => verifyDorm(dorm.id)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold shadow hover:scale-105 transition-transform"
                      >
                        Verify Dorm
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-foreground/60 py-6">
                All dorms are verified.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Footer Quick Actions - 2 rows of 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/pending-review")}
            className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-indigo-500 to-purple-400 text-white shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <FileText className="w-12 h-12" />
              <h3 className="text-xl font-bold">Review Forms</h3>
              <p className="text-sm opacity-90">Detailed submissions</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/students")}
            className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <Users className="w-12 h-12" />
              <h3 className="text-xl font-bold">Manage Students</h3>
              <p className="text-sm opacity-90">View student profiles</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/owners")}
            className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <Building2 className="w-12 h-12" />
              <h3 className="text-xl font-bold">Manage Owners</h3>
              <p className="text-sm opacity-90">Oversee owners</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/claims")}
            className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <ClipboardCheck className="w-12 h-12" />
              <h3 className="text-xl font-bold">Ownership Claims</h3>
              <p className="text-sm opacity-90">Review claims</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/dorms")}
            className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-violet-500 to-purple-400 text-white shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <Key className="w-12 h-12" />
              <h3 className="text-xl font-bold">Manage Properties</h3>
              <p className="text-sm opacity-90">View and edit all dorms</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/admin/rls-debugger")}
            className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-red-500 to-pink-400 text-white shadow-xl hover:shadow-2xl transition-all group"
          >
            <div className="flex flex-col items-center gap-4">
              <ShieldCheck className="w-12 h-12" />
              <h3 className="text-xl font-bold">RLS Debugger</h3>
              <p className="text-sm opacity-90">Debug permissions</p>
            </div>
          </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/admin/messages")}
          className="relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-cyan-500 to-blue-400 text-white shadow-xl hover:shadow-2xl transition-all group"
        >
            <div className="flex flex-col items-center gap-4">
              <MessageSquare className="w-12 h-12" />
              <h3 className="text-xl font-bold">Support Inbox</h3>
              <p className="text-sm opacity-90">Contact form messages</p>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

