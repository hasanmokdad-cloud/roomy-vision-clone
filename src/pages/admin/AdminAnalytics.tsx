import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel } from 'recharts';
import { useAdminDormsQuery } from '@/hooks/useAdminDormsQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';
import { EngagementChart } from '@/components/admin/EngagementChart';
import { supabase } from '@/integrations/supabase/client';

export default function AdminAnalytics() {
  const [priceByUniversity, setPriceByUniversity] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [paymentStats, setPaymentStats] = useState<any>(null);
  const { data: dorms } = useAdminDormsQuery();

  useEffect(() => {
    if (dorms) {
      loadAnalytics();
    }
    loadPaymentStats();
  }, [dorms]);

  const loadPaymentStats = async () => {
    try {
      // Fetch successful payments
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, payment_type, status, created_at, reservation_id')
        .eq('status', 'succeeded');

      if (payments) {
        // Calculate total revenue
        const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

        // Get reservation commissions
        const reservationPayments = payments.filter(p => p.payment_type === 'reservation');
        const { data: reservations } = await supabase
          .from('reservations')
          .select('commission_amount')
          .in('id', reservationPayments.map(p => p.reservation_id).filter(Boolean));

        const totalCommission = reservations?.reduce(
          (sum, r) => sum + (r.commission_amount || 0),
          0
        ) || 0;

        // Count by status
        const { data: allReservations } = await supabase
          .from('reservations')
          .select('status');

        const statusCounts = {
          paid: allReservations?.filter(r => r.status === 'paid').length || 0,
          pending: allReservations?.filter(r => r.status === 'pending_payment').length || 0,
          failed: allReservations?.filter(r => r.status === 'expired' || r.status === 'cancelled').length || 0,
        };

        setPaymentStats({
          totalRevenue,
          totalCommission,
          statusCounts,
          totalPayments: payments.length,
        });
      }
    } catch (error) {
      console.error('Error loading payment stats:', error);
    }
  };

  const loadAnalytics = () => {
    
    if (dorms) {
      // Avg price by university
      const uniPrices: any = {};
      dorms.forEach(d => {
        const uni = d.university || 'Unknown';
        if (!uniPrices[uni]) uniPrices[uni] = { total: 0, count: 0 };
        uniPrices[uni].total += Number(d.monthly_price || d.price || 0);
        uniPrices[uni].count += 1;
      });
      
      const priceData = Object.keys(uniPrices).map(uni => ({
        university: uni,
        avgPrice: Math.round(uniPrices[uni].total / uniPrices[uni].count),
      }));
      setPriceByUniversity(priceData);

      // Room types distribution
      const typeCount: any = {};
      dorms.forEach(d => {
        const types = d.room_types?.split(',') || ['Unknown'];
        types.forEach((t: string) => {
          const type = t.trim();
          typeCount[type] = (typeCount[type] || 0) + 1;
        });
      });
      
      const roomData = Object.keys(typeCount).map(type => ({
        name: type,
        value: typeCount[type],
      }));
      setRoomTypes(roomData);
    }
  };

  const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Analytics & Insights</h1>
        <p className="text-foreground/60 mt-2">Platform performance and trends</p>
      </div>

      {/* Revenue & Commission Cards */}
      {paymentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold gradient-text">
                ${paymentStats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {paymentStats.totalPayments} payments
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Roomy Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${paymentStats.totalCommission.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                10% of deposits
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Reservations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {paymentStats.statusCounts.paid}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed bookings
              </p>
            </CardContent>
          </Card>

          <Card className="glass-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending / Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {paymentStats.statusCounts.pending} / {paymentStats.statusCounts.failed}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Incomplete bookings
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue & Payouts Section */}
      <Card className="glass-hover">
        <CardHeader>
          <CardTitle className="text-2xl font-bold gradient-text">Revenue & Payouts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Platform Commission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${paymentStats?.totalCommission.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total captured (10%)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Owner Payouts Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {paymentStats?.statusCounts.paid || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Successful payouts
                </p>
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Owner Payouts Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {paymentStats?.statusCounts.pending || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting payout
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Average Price by University</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={priceByUniversity}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="university" stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }} 
            />
            <Bar dataKey="avgPrice" fill="#8B5CF6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Growth */}
      <UserGrowthChart />

      {/* Engagement Metrics */}
      <EngagementChart />

      <div className="glass-hover rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Room Types Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={roomTypes}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {roomTypes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(0,0,0,0.8)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }} 
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
