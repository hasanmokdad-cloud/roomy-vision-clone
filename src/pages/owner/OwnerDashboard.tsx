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
import { DormForm } from "@/components/owner/DormForm";

export default function OwnerDashboard() {
  const { loading, userId, role } = useRoleGuard();
  const [dorms, setDorms] = useState<any[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [selectedDorm, setSelectedDorm] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [rooms, setRooms] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!userId) return;
    fetchOwnerData();
  }, [userId]);

  const fetchOwnerData = async () => {
    if (!userId) return;

    try {
      // Check if user is admin
      const isAdmin = role === "admin";
      
      let dormsQuery = supabase.from("dorms").select("*");
      
      if (!isAdmin) {
        // Get owner record for non-admins
        const { data: owner, error: ownerError } = await supabase
          .from("owners")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (ownerError) throw ownerError;
        if (!owner) {
          console.error("Owner profile not found");
          return;
        }

        setOwnerId(owner.id);
        dormsQuery = dormsQuery.eq("owner_id", owner.id);
      } else {
        // Admin sees all dorms - set ownerId to userId for form operations
        setOwnerId(userId);
      }

      // Fetch dorms
      const { data: dormsData, error: dormsError } = await dormsQuery
        .order("created_at", { ascending: false });

      if (dormsError) {
        console.error("Error loading dorms:", dormsError);
        return;
      }
      
      setDorms(dormsData || []);

      // Fetch rooms for each dorm
      if (dormsData && dormsData.length > 0) {
        const dormIds = dormsData.map(d => d.id);
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .in("dorm_id", dormIds);

        if (roomsData) {
          const roomsByDorm: Record<string, any[]> = {};
          roomsData.forEach(room => {
            if (!roomsByDorm[room.dorm_id]) {
              roomsByDorm[room.dorm_id] = [];
            }
            roomsByDorm[room.dorm_id].push(room);
          });
          setRooms(roomsByDorm);
        }
      }
    } catch (error) {
      console.error("Error fetching owner data:", error);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

          <Card
            className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-secondary/10 to-accent/10 border-secondary/20"
            onClick={() => navigate('/owner/bulk-operations')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Bulk Operations</h3>
                  <p className="text-sm text-foreground/60">Update multiple rooms</p>
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
        {!isEditing && !showRoomForm && (
          <Card className="shadow-lg border border-muted/40 bg-card/80 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" /> My Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {dorms.length > 0 ? (
                <div className="space-y-6">
                  {dorms.map((dorm) => (
                    <div key={dorm.id} className="space-y-4">
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="rounded-2xl border border-muted bg-card shadow-md overflow-hidden"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          <img
                            src={dorm.cover_image || dorm.image_url || "/placeholder.svg"}
                            alt={dorm.dorm_name || dorm.name}
                            className="w-full md:w-48 h-40 object-cover"
                          />
                          <div className="flex-1 p-4 space-y-3">
                            <div>
                              <h3 className="font-bold text-xl text-foreground">
                                {dorm.dorm_name || dorm.name}
                              </h3>
                              <p className="text-sm text-foreground/60">
                                {dorm.address || dorm.location}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDorm(dorm);
                                  setIsEditing(true);
                                }}
                              >
                                Edit Dorm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedDorm(dorm);
                                  setShowRoomForm(true);
                                }}
                              >
                                Add Room
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/owner/dorms/${dorm.id}/rooms`)}
                              >
                                View Rooms ({rooms[dorm.id]?.length || 0})
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-foreground/60 py-6">
                  You haven't listed any dorms yet.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dorm Form */}
        {isEditing && selectedDorm && ownerId && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedDorm(null);
                }}
              >
                ← Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Edit Dorm</h2>
            </div>
            <DormForm
              dorm={selectedDorm}
              ownerId={ownerId}
              onSaved={() => {
                setIsEditing(false);
                setSelectedDorm(null);
                fetchOwnerData();
              }}
              onCancel={() => {
                setIsEditing(false);
                setSelectedDorm(null);
              }}
            />
          </div>
        )}

        {/* Add Room Form */}
        {showRoomForm && selectedDorm && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRoomForm(false);
                  setSelectedDorm(null);
                }}
              >
                ← Back to Dashboard
              </Button>
              <h2 className="text-2xl font-bold">Add Room to {selectedDorm.dorm_name || selectedDorm.name}</h2>
            </div>
            <Card className="glass-hover p-6">
              <p className="text-sm text-foreground/60 mb-4">
                Use the full room form for better management
              </p>
              <Button
                onClick={() => navigate(`/owner/dorms/${selectedDorm.id}/rooms/new`)}
                className="w-full"
              >
                Go to Room Form
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRoomForm(false);
                  setSelectedDorm(null);
                }}
                className="w-full mt-2"
              >
                Cancel
              </Button>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
}
