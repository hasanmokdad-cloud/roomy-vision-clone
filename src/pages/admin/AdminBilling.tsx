import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  RefreshCw,
  History,
  Download,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface CommissionRecord {
  id: string;
  reservation_id: string | null;
  student_id: string;
  owner_id: string;
  commission_amount: number;
  currency: string | null;
  status: string | null;
  payment_id: string | null;
  created_at: string | null;
}

export default function AdminBilling() {
  const { loading: roleLoading } = useRoleGuard("admin");
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CommissionRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<CommissionRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCommissions, setTotalCommissions] = useState(0);

  useEffect(() => {
    if (!roleLoading) {
      loadBillingData();
    }
  }, [roleLoading]);

  useEffect(() => {
    filterRecords();
  }, [records, statusFilter, searchQuery]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("admin_income_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRecords(data || []);
      const total = data?.reduce((sum, r) => sum + Number(r.commission_amount || 0), 0) || 0;
      setTotalCommissions(total);
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = [...records];

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.reservation_id?.toLowerCase().includes(query) ||
          r.student_id.toLowerCase().includes(query) ||
          r.owner_id.toLowerCase().includes(query)
      );
    }

    setFilteredRecords(filtered);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "captured":
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Captured</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Reservation ID", "Student ID", "Owner ID", "Commission", "Currency", "Status"];
    const rows = filteredRecords.map((r) => [
      r.created_at ? format(new Date(r.created_at), "yyyy-MM-dd HH:mm") : "",
      r.reservation_id || "",
      r.student_id,
      r.owner_id,
      r.commission_amount,
      r.currency || "USD",
      r.status || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-commissions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/wallet")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold gradient-text">Admin Billing History</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={loadBillingData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Summary Card */}
        <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-foreground/60">Total Commissions Earned</p>
                <p className="text-4xl font-bold text-green-600">${totalCommissions.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-foreground/60">Total Transactions</p>
                <p className="text-2xl font-semibold">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                <Input
                  placeholder="Search by reservation, student, or owner ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="captured">Captured</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Commission History ({filteredRecords.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reservation ID</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Owner ID</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-foreground/70">
                          {record.created_at
                            ? format(new Date(record.created_at), "MMM dd, yyyy HH:mm")
                            : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.reservation_id?.slice(0, 8) || "—"}...
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.student_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {record.owner_id.slice(0, 8)}...
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
              <div className="text-center py-12 text-foreground/60">
                <History className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No commission records found</p>
                <p className="text-sm">Commission records will appear here after reservations are paid.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}