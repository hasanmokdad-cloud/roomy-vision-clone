import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { Eye, Heart, MessageSquare } from "lucide-react";
import { OwnerMetricsSkeleton } from "@/components/skeletons/OwnerSkeletons";
import { motion } from "framer-motion";

export default function Performance() {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setOwnerId(user.id);
      const { data } = await supabase
        .from("owner_performance_view")
        .select("*")
        .eq("owner_id", user.id);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <OwnerMetricsSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-semibold text-gray-800">Your Performance</h1>
            <p className="text-gray-500 text-sm mt-1">Track how your listings are performing</p>
          </motion.div>

          {rows.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">No performance data available yet</p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {rows.map((r, index) => (
                <motion.div
                  key={r.dorm_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="rounded-2xl shadow-md hover:scale-[1.02] transition-transform">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-700">{r.dorm_name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Eye className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Views</p>
                          <p className="text-2xl font-bold text-gray-800">{r.views || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Heart className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Favorites</p>
                          <p className="text-2xl font-bold text-gray-800">{r.favorites || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Inquiries</p>
                          <p className="text-2xl font-bold text-gray-800">{r.inquiries || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
}