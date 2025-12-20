import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, CreditCard, Home, Sparkles, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { RoomyNavbar } from '@/components/RoomyNavbar';
import BottomNav from '@/components/BottomNav';
import { SwipeableSubPage } from '@/components/mobile/SwipeableSubPage';

interface BillingRecord {
  id: string;
  student_id: string;
  payment_id: string | null;
  amount: number;
  currency: string;
  type: string;
  description: string;
  payment_method_last4: string | null;
  created_at: string;
}

export default function BillingHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!loading && userId) {
      loadBillingHistory();
    }
  }, [loading, userId]);

  const loadBillingHistory = async () => {
    setIsLoading(true);
    try {
      // Get student ID first
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!student) {
        return;
      }

      // Load billing history
      const { data: records, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillingRecords(records || []);
    } catch (error) {
      console.error('Error loading billing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDetails = (record: BillingRecord) => {
    setSelectedRecord(record);
    setDetailsOpen(true);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'room_reservation') {
      return <Home className="w-4 h-4 text-primary" />;
    }
    return <Sparkles className="w-4 h-4 text-amber-500" />;
  };

  const getTypeLabel = (type: string) => {
    if (type === 'room_reservation') {
      return 'Room Reservation';
    }
    return 'AI Match Plan';
  };

  if (loading) return null;

  return (
    <SwipeableSubPage enabled={isMobile}>
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <RoomyNavbar />}

      <div className="container mx-auto px-4 py-8 pt-24 pb-32 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">Billing History</h1>
          <p className="text-muted-foreground mt-2">
            Track all your Roomy transactions
          </p>
        </div>

        <Card className="border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Transaction History
            </CardTitle>
            <CardDescription>
              All your payments and purchases on Roomy
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : billingRecords.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No billing activity</p>
                <p className="text-sm mt-1">
                  Your transaction history will appear here.
                </p>
              </div>
            ) : isMobile ? (
              // Mobile: Card layout
              <div className="space-y-3">
                {billingRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => openDetails(record)}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(record.type)}
                        <span className="font-medium text-sm">
                          {getTypeLabel(record.type)}
                        </span>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Paid
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {record.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-semibold text-primary">
                        ${record.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop: Table layout
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(record.type)}
                          <span className="line-clamp-1">{record.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${record.amount.toFixed(2)} {record.currency}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                          Paid
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetails(record)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {isMobile && <BottomNav />}

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              Transaction Details
            </DialogTitle>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment ID</span>
                  <span className="text-sm font-mono">
                    {selectedRecord.payment_id?.slice(0, 12) || selectedRecord.id.slice(0, 12)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedRecord.type)}
                    <span className="text-sm">{getTypeLabel(selectedRecord.type)}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="text-sm font-medium text-right max-w-[200px]">
                    {selectedRecord.description}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="text-sm">
                    {new Date(selectedRecord.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedRecord.payment_method_last4 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Card Used</span>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">•••• {selectedRecord.payment_method_last4}</span>
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Amount Paid</span>
                    <span className="text-2xl font-bold text-primary">
                      ${selectedRecord.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Badge variant="outline" className="w-full justify-center py-2 bg-green-500/10 text-green-600 border-green-500/30">
                Payment Successful
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </SwipeableSubPage>
  );
}
