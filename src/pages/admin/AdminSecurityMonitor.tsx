import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, Info, Clock, FileWarning, Ban, UserX, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  ip_region: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
  severity: string;
  created_at: string;
}

interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  affected_user_id: string | null;
  affected_record_id: string | null;
  table_affected: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface RlsRegressionResult {
  id: string;
  run_at: string;
  passed: boolean;
  issues_found: number;
  issues_detail: unknown[];
  triggered_by: string;
}

interface PasswordBreachLog {
  id: string;
  email_hash: string | null;
  action_type: string;
  breach_count: number | null;
  created_at: string;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: typeof ShieldAlert }> = {
  login_failed: { label: "Failed Login", icon: ShieldX },
  device_verification_failed: { label: "Device Verification Failed", icon: ShieldX },
  device_verified: { label: "Device Verified", icon: ShieldCheck },
  device_denied: { label: "Device Denied", icon: ShieldX },
  all_sessions_revoked: { label: "Sessions Revoked", icon: AlertTriangle },
  rate_limit_exceeded: { label: "Rate Limit Hit", icon: AlertTriangle },
  suspicious_activity: { label: "Suspicious Activity", icon: ShieldAlert },
  otp_failed: { label: "OTP Failed", icon: ShieldX },
  high_frequency_signup: { label: "High Frequency Signup", icon: AlertTriangle },
  password_breach_blocked: { label: "Breach Password Blocked", icon: Ban },
  rls_regression_detected: { label: "RLS Regression", icon: FileWarning },
  storage_rejection: { label: "Storage Rejection", icon: FileWarning },
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  role_change: "Role Change",
  refund_approval: "Refund Approved",
  reservation_modify: "Reservation Modified",
  dorm_delete: "Dorm Deleted",
  security_setting_change: "Security Setting Changed",
};

export default function AdminSecurityMonitor() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [rlsResults, setRlsResults] = useState<RlsRegressionResult[]>([]);
  const [breachLogs, setBreachLogs] = useState<PasswordBreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("events");
  const [stats, setStats] = useState({
    total24h: 0,
    critical24h: 0,
    warning24h: 0,
    uniqueUsers: 0,
    rateLimitHits: 0,
    breachBlocks: 0,
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("security_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter !== "all") {
        query = query.eq("event_type", filter);
      }
      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data as SecurityEvent[]) || []);

      // Calculate stats for last 24 hours
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: statsData } = await supabase
        .from("security_events")
        .select("severity, user_id, event_type")
        .gte("created_at", yesterday.toISOString());

      if (statsData) {
        const uniqueUsers = new Set(statsData.filter(e => e.user_id).map(e => e.user_id)).size;
        setStats({
          total24h: statsData.length,
          critical24h: statsData.filter(e => e.severity === "critical").length,
          warning24h: statsData.filter(e => e.severity === "warning").length,
          uniqueUsers,
          rateLimitHits: statsData.filter(e => e.event_type === "rate_limit_exceeded").length,
          breachBlocks: statsData.filter(e => e.event_type === "password_breach_blocked").length,
        });
      }
    } catch (error) {
      console.error("Error loading security events:", error);
      toast({
        title: "Error",
        description: "Failed to load security events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filter, severityFilter]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs((data as AdminAuditLog[]) || []);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    }
  }, []);

  const loadRlsResults = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rls_regression_results")
        .select("*")
        .order("run_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setRlsResults((data as RlsRegressionResult[]) || []);
    } catch (error) {
      console.error("Error loading RLS results:", error);
    }
  }, []);

  const loadBreachLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("password_breach_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setBreachLogs((data as PasswordBreachLog[]) || []);
    } catch (error) {
      console.error("Error loading breach logs:", error);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadAuditLogs();
    loadRlsResults();
    loadBreachLogs();

    // Subscribe to real-time security events
    const channel = supabase
      .channel("security_events_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_events" },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          setEvents((prev) => [newEvent, ...prev].slice(0, 100));
          
          if (newEvent.severity === "critical") {
            toast({
              title: "Critical Security Event",
              description: `${EVENT_TYPE_LABELS[newEvent.event_type]?.label || newEvent.event_type}`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEvents, loadAuditLogs, loadRlsResults, loadBreachLogs]);

  const getEventIcon = (eventType: string) => {
    const config = EVENT_TYPE_LABELS[eventType];
    const IconComponent = config?.icon || Info;
    return <IconComponent className="h-4 w-4" />;
  };

  const handleRefresh = () => {
    loadEvents();
    loadAuditLogs();
    loadRlsResults();
    loadBreachLogs();
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Security Monitor</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time security events, audit logs, and threat monitoring
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Events (24h)</CardDescription>
                <CardTitle className="text-2xl">{stats.total24h}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-red-500">Critical</CardDescription>
                <CardTitle className="text-2xl text-red-500">{stats.critical24h}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-yellow-500">Warnings</CardDescription>
                <CardTitle className="text-2xl text-yellow-500">{stats.warning24h}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Affected Users</CardDescription>
                <CardTitle className="text-2xl">{stats.uniqueUsers}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-orange-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-orange-500">Rate Limits</CardDescription>
                <CardTitle className="text-2xl text-orange-500">{stats.rateLimitHits}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-purple-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-purple-500">Breach Blocks</CardDescription>
                <CardTitle className="text-2xl text-purple-500">{stats.breachBlocks}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

        {/* Tabs for different panels */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">Security Events</TabsTrigger>
            <TabsTrigger value="audit">Admin Audit Trail</TabsTrigger>
            <TabsTrigger value="rls">RLS Tests</TabsTrigger>
            <TabsTrigger value="breach">Breach Detection</TabsTrigger>
          </TabsList>

          {/* Security Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  <SelectItem value="login_failed">Failed Login</SelectItem>
                  <SelectItem value="device_verification_failed">Device Verification Failed</SelectItem>
                  <SelectItem value="device_verified">Device Verified</SelectItem>
                  <SelectItem value="device_denied">Device Denied</SelectItem>
                  <SelectItem value="all_sessions_revoked">Sessions Revoked</SelectItem>
                  <SelectItem value="rate_limit_exceeded">Rate Limit Hit</SelectItem>
                  <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                  <SelectItem value="password_breach_blocked">Breach Password Blocked</SelectItem>
                  <SelectItem value="rls_regression_detected">RLS Regression</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Security Events</CardTitle>
                <CardDescription>Latest 100 events matching your filters</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Loading events...
                        </TableCell>
                      </TableRow>
                    ) : events.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          No security events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(event.created_at), "MMM d, HH:mm:ss")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEventIcon(event.event_type)}
                              <span className="text-sm">
                                {EVENT_TYPE_LABELS[event.event_type]?.label || event.event_type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={SEVERITY_COLORS[event.severity] || ""}
                            >
                              {event.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {event.user_id ? event.user_id.slice(0, 8) + "..." : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {event.ip_region || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {event.details ? JSON.stringify(event.details).slice(0, 50) : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Audit Trail Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Admin Audit Trail</CardTitle>
                <CardDescription>All administrative actions are logged for compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Affected User</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          No admin actions logged yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(log.created_at), "MMM d, HH:mm")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {ACTION_TYPE_LABELS[log.action_type] || log.action_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.admin_user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.affected_user_id ? log.affected_user_id.slice(0, 8) + "..." : "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.table_affected || "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] text-xs">
                            {log.new_values ? (
                              <span className="text-green-600">
                                +{JSON.stringify(log.new_values).slice(0, 30)}
                              </span>
                            ) : log.old_values ? (
                              <span className="text-red-600">
                                -{JSON.stringify(log.old_values).slice(0, 30)}
                              </span>
                            ) : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* RLS Regression Tests Tab */}
          <TabsContent value="rls">
            <Card>
              <CardHeader>
                <CardTitle>RLS Regression Test Results</CardTitle>
                <CardDescription>Automated security checks run after schema changes</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Run Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issues Found</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rlsResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          No RLS tests run yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      rlsResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(result.run_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            {result.passed ? (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Passed
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                <ShieldX className="h-3 w-3 mr-1" /> Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={result.issues_found > 0 ? "text-red-500 font-semibold" : ""}>
                              {result.issues_found}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.triggered_by}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[300px] text-xs text-muted-foreground truncate">
                            {result.issues_detail && result.issues_detail.length > 0 
                              ? JSON.stringify(result.issues_detail).slice(0, 80)
                              : "No issues"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breach Detection Tab */}
          <TabsContent value="breach">
            <Card>
              <CardHeader>
                <CardTitle>Password Breach Detection Logs</CardTitle>
                <CardDescription>Blocked signups/resets using compromised passwords (Have I Been Pwned)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action Blocked</TableHead>
                      <TableHead>Breach Count</TableHead>
                      <TableHead>Email Hash (Privacy)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breachLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          No breach detection events logged
                        </TableCell>
                      </TableRow>
                    ) : (
                      breachLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                              <Ban className="h-3 w-3 mr-1" />
                              {log.action_type === 'signup_blocked' ? 'Signup Blocked' : 'Reset Blocked'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-red-500 font-mono">
                              {log.breach_count?.toLocaleString() || 'Unknown'}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {log.email_hash ? log.email_hash.slice(0, 16) + "..." : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
