import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { User, Heart, MessageSquare, Activity, TrendingUp } from 'lucide-react';

interface StudentProfileModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentProfileModal({ studentId, isOpen, onClose }: StudentProfileModalProps) {
  const [student, setStudent] = useState<any>(null);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && studentId) {
      loadStudentData();
    }
  }, [isOpen, studentId]);

  const loadStudentData = async () => {
    setLoading(true);
    
    // Load student profile
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    setStudent(studentData);

    // Load AI recommendations history
    const { data: aiData } = await supabase
      .from('ai_recommendations_log')
      .select('*, dorms(name, dorm_name)')
      .eq('user_id', studentData?.user_id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    setAiHistory(aiData || []);

    // Load messages from conversations
    const { data: conversationsData } = await supabase
      .from('conversations')
      .select('id, messages(*), owners(full_name)')
      .eq('student_id', studentId);
    
    const allMessages = conversationsData?.flatMap(c => 
      c.messages.map((m: any) => ({
        ...m,
        owner_name: (c as any).owners?.full_name
      }))
    ) || [];
    setMessages(allMessages);

    // Load activity logs
    const { data: activityData } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', studentData?.user_id)
      .order('created_at', { ascending: false })
      .limit(100);
    
    setActivities(activityData || []);

    setLoading(false);
  };

  if (!student) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {student.full_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="ai-history">AI Matches</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{student.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{student.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">University</p>
                      <p className="font-medium">{student.university || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Age</p>
                      <p className="font-medium">{student.age || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">{student.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge>{student.status}</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Preferences</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Budget</p>
                      <p className="font-medium">${student.budget || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Room Type</p>
                      <p className="font-medium">{student.room_type || 'Any'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Roommate Needed</p>
                      <Badge variant={student.roommate_needed ? 'default' : 'secondary'}>
                        {student.roommate_needed ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    {student.favorite_areas && student.favorite_areas.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Favorite Areas</p>
                        <div className="flex flex-wrap gap-1">
                          {student.favorite_areas.map((area: string) => (
                            <Badge key={area} variant="outline">{area}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {student.preferred_amenities && student.preferred_amenities.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Preferred Amenities</p>
                        <div className="flex flex-wrap gap-1">
                          {student.preferred_amenities.map((amenity: string) => (
                            <Badge key={amenity} variant="outline">{amenity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    AI Profile Score
                  </h3>
                  <div className="text-3xl font-bold text-primary">
                    {student.ai_confidence_score || 50}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Profile completion: {student.profile_completion_score || 0}%
                  </p>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="ai-history">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {aiHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No AI match history</p>
                ) : (
                  aiHistory.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-pink-500" />
                          <span className="font-medium">
                            {(item.dorms as any)?.dorm_name || (item.dorms as any)?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.action}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="messages">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No messages</p>
                ) : (
                  messages.map((msg) => (
                    <Card key={msg.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 mt-1 text-blue-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {msg.sender_id === student.user_id ? 'Student' : msg.owner_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{msg.body}</p>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity logs</p>
                ) : (
                  activities.map((activity) => (
                    <Card key={activity.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span className="text-sm font-medium">{activity.type}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}