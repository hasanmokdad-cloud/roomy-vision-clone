import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Wallet, CreditCard, RefreshCw, Plus, Trash2, Eye, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { OwnerWalletSkeleton } from '@/components/skeletons/OwnerSkeletons';
import { useToast } from '@/hooks/use-toast';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import { format } from 'date-fns';

interface PayoutCard {
  id: string;
  owner_id: string;
  whish_token: string;
  brand: string;
  last4: string;
  is_default: boolean;
  created_at: string;
  exp_month?: number;
  exp_year?: number;
  country?: string;
  balance?: number;
}

interface PayoutRecord {
  id: string;
  owner_id: string;
  student_id: string;
  room_id: string;
  dorm_id: string;
  deposit_amount: number;
  roomy_fee: number;
  owner_receives: number;
  currency: string;
  payment_id: string | null;
  reservation_id: string | null;
  status: string;
  created_at: string;
  room?: { name: string };
  dorm?: { name: string };
  student?: { full_name: string };
}

export default function OwnerFinanceHub() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useRoleGuard('owner');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  
  // Wallet state
  const [payoutCard, setPayoutCard] = useState<PayoutCard | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailsModal, setDetailsModal] = useState<PayoutRecord | null>(null);

  // Computed values
  const totalEarnings = payoutHistory
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.owner_receives, 0);

  const currentBalance = payoutCard?.balance || 0;

  useEffect(() => {
    if (userId) {
      loadOwnerData();
    }
  }, [userId]);

  const loadOwnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!owner) return;
      setOwnerId(owner.id);

      await loadWalletData(owner.id);
    } catch (error) {
      console.error('Error loading owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async (ownerId: string) => {
    const { data: cards } = await supabase
      .from('owner_payment_methods')
      .select('*')
      .eq('owner_id', ownerId)
      .eq('is_default', true)
      .limit(1);

    if (cards && cards.length > 0) {
      setPayoutCard(cards[0]);
    }

    const { data: history } = await supabase
      .from('payout_history')
      .select(`
        *,
        room:rooms(name),
        dorm:dorms(name),
        student:students(full_name)
      `)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (history) {
      setPayoutHistory(history);
    }
  };

  const handleRefresh = async () => {
    if (!ownerId) return;
    setRefreshing(true);
    await loadWalletData(ownerId);
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'Data updated.' });
  };

  const handleAddCard = () => {
    if (ownerId) {
      navigate(`/mock-whish-owner-add-card?ownerId=${ownerId}`);
    }
  };

  const handleReplaceCard = () => {
    if (ownerId) {
      navigate(`/mock-whish-owner-add-card?ownerId=${ownerId}&replace=true`);
    }
  };

  const handleDeleteCard = async () => {
    if (!payoutCard) return;
    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from('owner_payment_methods')
        .delete()
        .eq('id', payoutCard.id);

      if (error) throw error;

      setPayoutCard(null);
      setDeleteModalOpen(false);
      toast({
        title: 'Card Removed',
        description: 'Your payout card has been removed.',
      });
    } catch (error) {
      console.error('Error removing card:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove card. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'pending': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'failed': return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const CardBrandIcon = ({ brand }: { brand: string }) => {
    const brandLower = brand?.toLowerCase() || '';
    if (brandLower.includes('visa')) return <span className="text-blue-600 font-bold">VISA</span>;
    if (brandLower.includes('master')) return <span className="text-orange-500 font-bold">MC</span>;
    if (brandLower.includes('amex')) return <span className="text-blue-500 font-bold">AMEX</span>;
    return <CreditCard className="h-5 w-5" />;
  };

  if (loading) {
    return <OwnerWalletSkeleton />;
  }

  return (
    <OwnerLayout>
      <div className="p-4 md:p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <OwnerBreadcrumb items={[{ label: 'Finance' }]} />
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/owner')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  Finance
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage your earnings and payout method
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Current Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ${currentBalance.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Available for withdrawal</p>
              </CardContent>
            </Card>

            <Card className="glass-hover">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All time completed payouts</p>
              </CardContent>
            </Card>
          </div>

          {/* Payout Method Section */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payout Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payoutCard ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gradient-to-r from-primary to-secondary rounded flex items-center justify-center">
                      <CardBrandIcon brand={payoutCard.brand} />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {payoutCard.brand || 'Card'} •••• {payoutCard.last4}
                      </p>
                      {payoutCard.exp_month && payoutCard.exp_year && (
                        <p className="text-sm text-muted-foreground">
                          Expires {payoutCard.exp_month}/{payoutCard.exp_year}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleReplaceCard}>
                      Replace
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteModalOpen(true)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No payout method added yet</p>
                  <Button onClick={handleAddCard} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Payout Card
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout History Table */}
          <Card className="glass-hover">
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
            </CardHeader>
            <CardContent>
              {payoutHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payouts yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutHistory.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{format(new Date(payout.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{payout.room?.name || 'N/A'}</TableCell>
                          <TableCell>{payout.student?.full_name || 'N/A'}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ${payout.owner_receives.toFixed(2)}
                          </TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDetailsModal(payout)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Card Confirmation */}
          <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove Payout Card?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your payout card. You won't be able to receive payouts until you add a new card.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCard}
                  disabled={deleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleting ? 'Removing...' : 'Remove Card'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Payout Details Modal */}
          <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Payout Details</DialogTitle>
              </DialogHeader>
              {detailsModal && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Room</p>
                      <p className="font-medium">{detailsModal.room?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Student</p>
                      <p className="font-medium">{detailsModal.student?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deposit Paid</p>
                      <p className="font-medium">${detailsModal.deposit_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Roomy Fee (10%)</p>
                      <p className="font-medium text-red-600">-${detailsModal.roomy_fee.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">You Receive</p>
                      <p className="font-medium text-green-600">${detailsModal.owner_receives.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      {getStatusBadge(detailsModal.status)}
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(detailsModal.created_at), 'PPP')}</p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}
