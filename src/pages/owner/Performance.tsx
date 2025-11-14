import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";

export default function Performance() {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);

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
    })();
  }, []);

  return (
    <div className="p-6 pb-28">
      <h1 className="text-3xl font-black gradient-text">Your Performance</h1>
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        {rows.map((r) => (
          <Card key={r.dorm_id} className="p-6">
            <p className="font-semibold mb-1">{r.dorm_name}</p>
            <p className="text-sm text-foreground/60">Views: {r.views}</p>
            <p className="text-sm text-foreground/60">Favorites: {r.favorites}</p>
            <p className="text-sm text-foreground/60">Inquiries: {r.inquiries}</p>
          </Card>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
