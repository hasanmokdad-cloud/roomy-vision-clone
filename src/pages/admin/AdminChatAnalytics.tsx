import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Users, MessageSquare, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { subDays, startOfDay, format, getHours, getDay } from 'date-fns';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DateRange = 'today' | '7days' | '30days' | 'semester';

type DormStats = {
  name: string;
  conversations: number;
  messages: number;
  students: number;
  bookings: number;
};

type OwnerStats = {
  id: string;
  name: string;
  photo: string | null;
  chats: number;
  avgResponseTime: number;
  acceptedBookings: number;
  declinedBookings: number;
  audioMessages: number;
};

type StudentStats = {
  id: string;
  name: string;
  photo: string | null;
  dormsContacted: number;
  messagesSent: number;
  bookingsInitiated: number;
  conversionRate: number;
};

export default function AdminChatAnalytics() {
  const { loading } = useRoleGuard('admin');
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30days');
  const [loadingData, setLoadingData] = useState(true);
  
  const [busiestDorms, setBusiestDorms] = useState<DormStats[]>([]);
  const [busiestOwners, setBusiestOwners] = useState<OwnerStats[]>([]);
  const [activeStudents, setActiveStudents] = useState<StudentStats[]>([]);
  const [heatmapData, setHeatmapData] = useState<number[][]>([]);
  const [platformData, setPlatformData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading) {
      loadAnalytics();
    }
  }, [dateRange, loading]);

  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return startOfDay(now);
      case '7days':
        return subDays(now, 7);
      case '30days':
        return subDays(now, 30);
      case 'semester':
        return subDays(now, 120); // ~4 months
      default:
        return subDays(now, 30);
    }
  };

  const loadAnalytics = async () => {
    setLoadingData(true);
    const cutoffDate = getDateFilter();

    try {
      // Fetch conversations with messages
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          dorm_id,
          student_id,
          owner_id,
          updated_at,
          messages(id, sender_id, created_at, attachment_type, body)
        `)
        .gte('updated_at', cutoffDate.toISOString());

      // Fetch dorms
      const dormIds = [...new Set(conversations?.map(c => c.dorm_id).filter(Boolean))];
      const { data: dorms } = await supabase
        .from('dorms')
        .select('id, name, dorm_name')
        .in('id', dormIds);

      // Fetch students
      const studentIds = [...new Set(conversations?.map(c => c.student_id).filter(Boolean))];
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, profile_photo_url')
        .in('id', studentIds);

      // Fetch owners
      const ownerIds = [...new Set(conversations?.map(c => c.owner_id).filter(Boolean))];
      const { data: owners } = await supabase
        .from('owners')
        .select('id, full_name, profile_photo_url')
        .in('id', ownerIds);

      // Fetch bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('dorm_id, student_id, owner_id, status, meeting_platform, created_at')
        .gte('created_at', cutoffDate.toISOString());

      // Process data
      processDormStats(conversations, dorms, bookings);
      processOwnerStats(conversations, owners, bookings);
      processStudentStats(conversations, students, bookings);
      processHeatmap(conversations);
      processPlatformBreakdown(bookings, conversations);

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const processDormStats = (conversations: any[], dorms: any[], bookings: any[]) => {
    const dormMap = new Map(dorms?.map(d => [d.id, d.name || d.dorm_name]) || []);
    const stats = new Map<string, DormStats>();

    conversations?.forEach(conv => {
      if (!conv.dorm_id) return;
      const dormName = dormMap.get(conv.dorm_id) || 'Unknown Dorm';
      const existing = stats.get(conv.dorm_id) || {
        name: dormName,
        conversations: 0,
        messages: 0,
        students: 0,
        bookings: 0,
      };

      existing.conversations += 1;
      existing.messages += conv.messages?.length || 0;
      stats.set(conv.dorm_id, existing);
    });

    // Count unique students per dorm
    conversations?.forEach(conv => {
      if (!conv.dorm_id) return;
      const stat = stats.get(conv.dorm_id);
      if (stat) stat.students += 1;
    });

    // Count bookings per dorm
    bookings?.forEach(booking => {
      const stat = stats.get(booking.dorm_id);
      if (stat) stat.bookings += 1;
    });

    const sortedDorms = Array.from(stats.values())
      .sort((a, b) => b.messages - a.messages)
      .slice(0, 5);

    setBusiestDorms(sortedDorms);
  };

  const processOwnerStats = (conversations: any[], owners: any[], bookings: any[]) => {
    const ownerMap = new Map(owners?.map(o => [o.id, o]) || []);
    const stats = new Map<string, OwnerStats>();

    conversations?.forEach(conv => {
      if (!conv.owner_id) return;
      const owner = ownerMap.get(conv.owner_id);
      const existing = stats.get(conv.owner_id) || {
        id: conv.owner_id,
        name: owner?.full_name || 'Unknown Owner',
        photo: owner?.profile_photo_url || null,
        chats: 0,
        avgResponseTime: 0,
        acceptedBookings: 0,
        declinedBookings: 0,
        audioMessages: 0,
      };

      existing.chats += 1;
      
      // Count audio messages
      const audioCount = conv.messages?.filter((m: any) => 
        m.attachment_type === 'audio' && m.sender_id === conv.owner_id
      ).length || 0;
      existing.audioMessages += audioCount;

      stats.set(conv.owner_id, existing);
    });

    // Count bookings
    bookings?.forEach(booking => {
      const stat = stats.get(booking.owner_id);
      if (stat) {
        if (booking.status === 'approved') stat.acceptedBookings += 1;
        if (booking.status === 'declined') stat.declinedBookings += 1;
      }
    });

    const sortedOwners = Array.from(stats.values())
      .sort((a, b) => b.chats - a.chats)
      .slice(0, 5);

    setBusiestOwners(sortedOwners);
  };

  const processStudentStats = (conversations: any[], students: any[], bookings: any[]) => {
    const studentMap = new Map(students?.map(s => [s.id, s]) || []);
    const stats = new Map<string, StudentStats>();

    conversations?.forEach(conv => {
      const student = studentMap.get(conv.student_id);
      const existing = stats.get(conv.student_id) || {
        id: conv.student_id,
        name: student?.full_name || 'Unknown Student',
        photo: student?.profile_photo_url || null,
        dormsContacted: 0,
        messagesSent: 0,
        bookingsInitiated: 0,
        conversionRate: 0,
      };

      existing.dormsContacted += 1;
      const studentMessages = conv.messages?.filter((m: any) => m.sender_id === conv.student_id).length || 0;
      existing.messagesSent += studentMessages;

      stats.set(conv.student_id, existing);
    });

    // Count bookings initiated
    bookings?.forEach(booking => {
      const stat = stats.get(booking.student_id);
      if (stat) stat.bookingsInitiated += 1;
    });

    // Calculate conversion rates
    stats.forEach(stat => {
      if (stat.dormsContacted > 0) {
        stat.conversionRate = (stat.bookingsInitiated / stat.dormsContacted) * 100;
      }
    });

    const sortedStudents = Array.from(stats.values())
      .sort((a, b) => b.messagesSent - a.messagesSent)
      .slice(0, 5);

    setActiveStudents(sortedStudents);
  };

  const processHeatmap = (conversations: any[]) => {
    // Initialize 7 days x 24 hours grid
    const grid: number[][] = Array(7).fill(0).map(() => Array(24).fill(0));

    conversations?.forEach(conv => {
      conv.messages?.forEach((msg: any) => {
        const date = new Date(msg.created_at);
        const day = getDay(date); // 0 = Sunday
        const hour = getHours(date);
        grid[day][hour] += 1;
      });
    });

    setHeatmapData(grid);
  };

  const processPlatformBreakdown = (bookings: any[], conversations: any[]) => {
    const totalConversations = conversations?.length || 0;
    const conversationsWithBookings = bookings?.length || 0;
    
    const platformCounts = {
      'Google Meet': 0,
      'Zoom': 0,
      'Microsoft Teams': 0,
      'Other': 0,
    };

    bookings?.forEach(booking => {
      if (booking.meeting_platform) {
        if (booking.meeting_platform.includes('meet.google')) {
          platformCounts['Google Meet'] += 1;
        } else if (booking.meeting_platform.includes('zoom')) {
          platformCounts['Zoom'] += 1;
        } else if (booking.meeting_platform.includes('teams')) {
          platformCounts['Microsoft Teams'] += 1;
        } else {
          platformCounts['Other'] += 1;
        }
      }
    });

    const data = [
      { name: 'With Booking', value: conversationsWithBookings, color: '#10b981' },
      { name: 'No Booking', value: totalConversations - conversationsWithBookings, color: '#6b7280' },
    ];

    setPlatformData([
      ...data,
      ...Object.entries(platformCounts).map(([name, value]) => ({
        name,
        value,
        color: name === 'Google Meet' ? '#4285F4' : name === 'Zoom' ? '#2D8CFF' : name === 'Microsoft Teams' ? '#5558AF' : '#94a3b8',
      })),
    ]);
  };

  const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <p className="text-foreground/60">Loading analytics...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/chats')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold gradient-text">Chat Analytics</h2>
            </div>
          </div>
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-8">
        {/* Busiest Dorms */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Busiest Dorms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={busiestDorms}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="conversations" fill="#8b5cf6" name="Conversations" />
                <Bar dataKey="messages" fill="#ec4899" name="Messages" />
                <Bar dataKey="students" fill="#06b6d4" name="Students" />
                <Bar dataKey="bookings" fill="#10b981" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Busiest Owners */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Busiest Owners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {busiestOwners.map((owner, idx) => (
                <div key={owner.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/20">
                  <span className="text-2xl font-bold text-primary">#{idx + 1}</span>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={owner.photo || undefined} />
                    <AvatarFallback>{owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{owner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {owner.chats} chats • {owner.acceptedBookings} accepted • {owner.audioMessages} audio
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active Students */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Most Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeStudents.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/20">
                  <span className="text-2xl font-bold text-primary">#{idx + 1}</span>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={student.photo || undefined} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.dormsContacted} dorms • {student.messagesSent} messages • {student.conversionRate.toFixed(1)}% conversion
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peak Activity Heatmap */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Peak Activity Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-grid grid-cols-25 gap-1 min-w-max">
                <div className="col-span-1"></div>
                {Array.from({ length: 24 }, (_, i) => (
                  <div key={i} className="text-xs text-center text-muted-foreground">{i}</div>
                ))}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => (
                  <>
                    <div key={day} className="text-xs text-muted-foreground pr-2">{day}</div>
                    {heatmapData[dayIdx]?.map((count, hourIdx) => {
                      const maxCount = Math.max(...heatmapData.flat());
                      const opacity = maxCount > 0 ? count / maxCount : 0;
                      return (
                        <div
                          key={`${dayIdx}-${hourIdx}`}
                          className="w-8 h-8 rounded"
                          style={{
                            backgroundColor: `rgba(139, 92, 246, ${opacity})`,
                          }}
                          title={`${day} ${hourIdx}:00 - ${count} messages`}
                        />
                      );
                    })}
                  </>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
