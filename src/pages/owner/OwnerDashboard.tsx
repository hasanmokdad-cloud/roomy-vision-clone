// src/pages/owner/OwnerDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Home, MessageSquare, TrendingUp } from "lucide-react";
import { NotificationBell } from "@/components/owner/NotificationBell";

export default function OwnerDashboard() {
  const { loading, userId } = useRoleGuard("owner");
  const [dorms, setDorms] = useState<any[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    const fetchOwnerData = async () => {
      // Get owner record first
      const { data: owner } = await supabase
        .from("owners")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!owner) return;
      
      setOwnerId(owner.id);

      const { data, error } = await supabase
        .from("dorms")
        .select("*")
        .eq("owner_id", owner.id);

      if (error) console.error("Error loading dorms:", error);
      else setDorms(data || []);
    };

    fetchOwnerData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-foreground/60">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 md:px-12 py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold gradient-text">
              Welcome Back, Owner
            </h1>
            <p className="text-foreground/70 mt-2">
              Manage your listed dorms, chat with students, and view performance.
            </p>
          </div>

          <div className="flex items-center gap-3 mt-6 md:mt-0">
            {ownerId && <NotificationBell ownerId={ownerId} />}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card
            className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20"
            onClick={() => navigate('/owner/add-dorm')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <PlusCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Add New Dorm</h3>
                  <p className="text-sm text-foreground/60">Create a new listing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20"
            onClick={() => navigate('/owner/claim-dorm')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <Home className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Claim Existing Dorm</h3>
                  <p className="text-sm text-foreground/60">Link your verified dorm</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-500" /> Total Dorms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dorms.length}</p>
              <p className="text-sm text-foreground/60">Currently listed</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" /> Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">↑ 27%</p>
              <p className="text-sm text-foreground/60">More inquiries this month</p>
            </CardContent>
          </Card>

          <Card className="shadow-md border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" /> Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">12</p>
              <p className="text-sm text-foreground/60">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Dorm Management */}
        <Card className="shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" /> My Properties
              </CardTitle>
              <Button
                onClick={() => navigate("/owner/rooms")}
                variant="outline"
              >
                Manage Rooms
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dorms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {dorms.map((dorm, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    className="rounded-2xl border border-muted bg-white dark:bg-gray-900 shadow-md overflow-hidden"
                  >
                    <img
                      src={dorm.cover_image || dorm.image_url || "/placeholder.svg"}
                      alt={dorm.dorm_name || dorm.name}
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4 space-y-1">
                      <h3 className="font-semibold text-lg text-foreground">
                        {dorm.dorm_name || dorm.name}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        {dorm.address || dorm.location}
                      </p>
                      <p className="text-primary font-medium">
                        ${dorm.monthly_price || dorm.price}/month
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-foreground/60 py-6">
                You haven't listed any dorms yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
