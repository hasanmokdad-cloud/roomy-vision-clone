import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  History,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { CardBrandIcon } from "@/components/payments/CardBrandIcons";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface AdminCard {
  id: string;
  card_last4: string;
  card_brand: string;
  card_country: string;
  exp_month: number;
  exp_year: number;
}

interface CommissionRecord {
  id: string;
  reservation_id: string;
  student_id: string;
  owner_id: string;
  commission_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export default function AdminWallet() {
  const { loading: roleLoading } = useRoleGuard("admin");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [adminCard, setAdminCard] = useState<AdminCard | null>(null);
  const [balance, setBalance] = useState(0);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [recentCommissions, setRecentCommissions] = useState<CommissionRecord[]>([]);
  // lastPayoutStatus removed - not applicable for admin commission model

  useEffect(() => {
    if (!roleLoading) {
      loadAdminWalletData();
    }
  }, [roleLoading]);

  const loadAdminWalletData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch admin wallet (card info)
      const { data: walletData } = await supabase
        .from("admin_wallet")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      if (walletData) {
        setAdminCard({
          id: walletData.id,
          card_last4: walletData.card_last4 || "",
          card_brand: walletData.card_brand || "visa",
          card_country: walletData.card_country || "Lebanon",
          exp_month: walletData.exp_month || 0,
          exp_year: walletData.exp_year || 0,
        });
        setBalance(walletData.balance || 0);
      }

      // Fetch total commissions from admin_income_history
      const { data: totalData } = await supabase
        .from("admin_income_history")
        .select("commission_amount");
      
      const total = totalData?.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0) || 0;
      setTotalCommissions(total);

      // Fetch recent commissions
      const { data: recentData } = await supabase
        .from("admin_income_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setRecentCommissions(recentData || []);

      // lastPayoutStatus logic removed

    } catch (error) {
      console.error("Error loading admin wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCard = async () => {
    if (!adminCard) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("admin_wallet")
        .delete()
        .eq("admin_id", user.id);

      if (error) throw error;

      setAdminCard(null);
      toast({
        title: "Card Removed",
        description: "Your payout card has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "captured":
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Captured</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (roleLoading || loading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-3xl font-semibold text-foreground">Admin Wallet & Payouts</h1>
            </div>
            <Button variant="outline" size="sm" onClick={loadAdminWalletData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Balance Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/20 via-purple-500/15 to-teal-500/20 border-white/20 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-white/80 dark:bg-black/50 backdrop-blur-lg m-1 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-foreground/70">
                      <Wallet className="w-5 h-5" />
                      <span className="font-medium">Admin Wallet</span>
                    </div>
                    <div className="text-5xl font-black bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
                      ${balance.toFixed(2)}
                    </div>
                    <p className="text-sm text-foreground/60">Current Balance</p>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-green-500/10">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Total Commissions Earned</p>
                        <p className="text-xl font-bold text-green-600">${totalCommissions.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Two Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Linked Whish Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Payout Method (Whish Card)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adminCard && adminCard.card_last4 ? (
                  <div className="space-y-4">
                    {/* Card Preview */}
                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl">
                      <div className="absolute top-4 right-4">
                        <CardBrandIcon brand={adminCard.card_brand} />
                      </div>
                      <div className="space-y-6">
                        <div className="text-lg tracking-widest font-mono">
                          •••• •••• •••• {adminCard.card_last4}
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-gray-400">EXPIRES</p>
                            <p className="font-mono">
                              {String(adminCard.exp_month).padStart(2, "0")}/{adminCard.exp_year}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">COUNTRY</p>
                            <p className="text-sm">{adminCard.card_country}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate("/mock-whish-admin-add-card")}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Change Card
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleRemoveCard}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">No Payout Card Added</h3>
                      <p className="text-foreground/60 text-sm">
                        Set up your Whish account to receive commission payouts
                      </p>
                    </div>
                    <Button
                      className="bg-gradient-to-r from-primary to-purple-500"
                      onClick={() => navigate("/mock-whish-admin-add-card")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Payout Card
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Commission Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-foreground/60">Captured</p>
                    <p className="text-2xl font-bold text-green-600">
                      {recentCommissions.filter(c => c.status === "captured").length}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-foreground/60">Pending</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {recentCommissions.filter(c => c.status === "pending").length}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/admin/billing")}
                >
                  <History className="w-4 h-4 mr-2" />
                  View Full Billing History
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Commissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Recent Commission Payouts
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/billing")}>
                View All →
              </Button>
            </CardHeader>
            <CardContent>
              {recentCommissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reservation</TableHead>
                        <TableHead>Commission (10%)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentCommissions.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-foreground/70">
                            {format(new Date(record.created_at), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {record.reservation_id?.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${Number(record.commission_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(record.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-foreground/60">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No commission payouts yet</p>
                </div>
              )}
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}