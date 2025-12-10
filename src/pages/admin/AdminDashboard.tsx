// src/pages/admin/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Building2,
  CheckCircle2,
  ShieldAlert,
  Home,
  DollarSign,
  Wallet,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminDashboard() {
  const { loading } = useRoleGuard("admin");
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    students: 0,
    owners: 0,
    dorms: 0,
    pendingDorms: 0,
  });
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [earningsStats, setEarningsStats] = useState({
    totalCommission: 0,
    pendingPayouts: 0,
    pendingRefunds: 0,
    walletBalance: 0,
  });

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
    loadEarningsStats();

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

  const loadEarningsStats = async () => {
    // Get total commission from admin_income_history
    const { data: commissionData } = await supabase
      .from("admin_income_history")
      .select("commission_amount")
      .eq("status", "captured");
    
    const totalCommission = commissionData?.reduce(
      (sum, row) => sum + (row.commission_amount || 0), 0
    ) || 0;

    // Get pending owner payouts count
    const { count: pendingPayoutsCount } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .match({ payment_status: "paid", owner_payout_status: "pending" });

    // Get pending refund requests count
    const { count: pendingRefundsCount } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .match({ refund_status: "pending_admin" });

    // Get admin wallet balance
    const { data: walletData } = await supabase
      .from("admin_wallet")
      .select("balance")
      .limit(1)
      .single();

    setEarningsStats({
      totalCommission,
      pendingPayouts: pendingPayoutsCount || 0,
      pendingRefunds: pendingRefundsCount || 0,
      walletBalance: walletData?.balance || 0,
    });
  };

  const verifyDorm = async (id: string) => {
    try {
      console.log('🔍 [AdminDashboard] Starting verification for dorm:', id);
      
      const { data, error } = await supabase.rpc('admin_update_verification_status', {
        p_dorm_id: id,
        p_new_status: 'Verified',
        p_rejection_reason: null
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-lg font-medium text-muted-foreground mb-1">
              Welcome Back, CEO
            </h2>
            <h1 className="text-3xl font-semibold text-foreground">
              Admin Control Panel
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, monitor listings, and verify dorms.
            </p>
          </motion.div>

          {/* System Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="rounded-2xl shadow-md border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Users className="w-4 h-4 text-blue-500" /> Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.students}</p>
                <p className="text-sm text-muted-foreground">Active profiles</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Building2 className="w-4 h-4 text-green-500" /> Owners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.owners}</p>
                <p className="text-sm text-muted-foreground">
                  Registered property owners
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Home className="w-4 h-4 text-purple-500" /> Dorms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.dorms}</p>
                <p className="text-sm text-muted-foreground">Verified properties</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShieldAlert className="w-4 h-4 text-yellow-500" /> Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stats.pendingDorms}</p>
                <p className="text-sm text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Financial Shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Your Earnings */}
            <Card className="rounded-2xl shadow-md border-border/40 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="w-4 h-4 text-green-500" /> Your Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-green-500">
                    ${earningsStats.totalCommission.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Commission</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-yellow-500">
                    {earningsStats.pendingPayouts}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Owner Payouts</p>
                </div>
                <Button
                  onClick={() => navigate("/admin/earnings")}
                  className="w-full mt-2"
                  variant="outline"
                >
                  View Earnings <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Wallet & Payouts */}
            <Card className="rounded-2xl shadow-md border-border/40 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Wallet className="w-4 h-4 text-blue-500" /> Wallet & Payouts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-blue-500">
                    ${earningsStats.walletBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Wallet Balance</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-muted-foreground">
                    {earningsStats.pendingPayouts}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Payouts</p>
                </div>
                <Button
                  onClick={() => navigate("/admin/wallet")}
                  className="w-full mt-2"
                  variant="outline"
                >
                  Open Wallet <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Refund Requests */}
            <Card className="rounded-2xl shadow-md border-border/40 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <RefreshCcw className="w-4 h-4 text-orange-500" /> Refund Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold text-orange-500">
                    {earningsStats.pendingRefunds}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-muted-foreground">—</p>
                  <p className="text-xs text-muted-foreground">Awaiting Review</p>
                </div>
                <Button
                  onClick={() => navigate("/admin/refunds")}
                  className="w-full mt-2"
                  variant="outline"
                >
                  View Requests <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pending Verification Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-2xl shadow-md border-border/40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
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
                        className="rounded-2xl border border-border bg-card shadow-md overflow-hidden"
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
                          <p className="text-sm text-muted-foreground">
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
                  <p className="text-center text-muted-foreground py-6">
                    All dorms are verified.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}
