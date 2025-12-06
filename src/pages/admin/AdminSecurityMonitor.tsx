import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, Info, Clock } from "lucide-react";
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
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  critical: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function AdminSecurityMonitor() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total24h: 0,
    critical24h: 0,
    warning24h: 0,
    uniqueUsers: 0,
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
        .select("severity, user_id")
        .gte("created_at", yesterday.toISOString());

      if (statsData) {
        const uniqueUsers = new Set(statsData.filter(e => e.user_id).map(e => e.user_id)).size;
        setStats({
          total24h: statsData.length,
          critical24h: statsData.filter(e => e.severity === "critical").length,
          warning24h: statsData.filter(e => e.severity === "warning").length,
          uniqueUsers,
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

  useEffect(() => {
    loadEvents();

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
  }, [loadEvents]);

  const getEventIcon = (eventType: string) => {
    const config = EVENT_TYPE_LABELS[eventType];
    const IconComponent = config?.icon || Info;
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Security Monitor</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Real-time security events and threat monitoring
            </p>
          </div>
          <Button onClick={loadEvents} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <CardDescription className="text-red-500">Critical (24h)</CardDescription>
                <CardTitle className="text-2xl text-red-500">{stats.critical24h}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-yellow-500">Warnings (24h)</CardDescription>
                <CardTitle className="text-2xl text-yellow-500">{stats.warning24h}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Affected Users (24h)</CardDescription>
                <CardTitle className="text-2xl">{stats.uniqueUsers}</CardTitle>
              </CardHeader>
            </Card>
          </motion.div>
        </div>

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
              <SelectItem value="otp_failed">OTP Failed</SelectItem>
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

        {/* Events Table */}
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
      </div>
    </AdminLayout>
  );
}
