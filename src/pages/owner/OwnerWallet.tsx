import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Wallet, Plus, Trash2, RefreshCw, Eye, Building2, User, TrendingUp, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { OwnerSidebar } from '@/components/owner/OwnerSidebar';
import { format } from 'date-fns';
import { detectCardBrand } from '@/components/payments/CardBrandIcons';

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

export default function OwnerWallet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payoutCard, setPayoutCard] = useState<PayoutCard | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailsModal, setDetailsModal] = useState<PayoutRecord | null>(null);

  // Calculate summary stats
  const totalEarnings = payoutHistory
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.owner_receives, 0);
  
  const pendingPayouts = payoutHistory
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.owner_receives, 0);

  const lastPayout = payoutHistory.find(p => p.status === 'paid');
  const nextPending = payoutHistory.find(p => p.status === 'pending');

  useEffect(() => {
    loadOwnerData();
  }, []);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'payout_card_added') {
      toast({
        title: 'Payout Card Added',
        description: 'Your Whish payout card has been successfully added.',
      });
      window.history.replaceState({}, '', '/owner/wallet');
    }
  }, [searchParams, toast]);

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

      const { data: cards } = await supabase
        .from('owner_payment_methods')
        .select('*')
        .eq('owner_id', owner.id)
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
        .eq('owner_id', owner.id)
        .order('created_at', { ascending: false });

      if (history) {
        setPayoutHistory(history);
      }
    } catch (error) {
      console.error('Error loading owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOwnerData();
    setRefreshing(false);
    toast({ title: 'Refreshed', description: 'Payout data updated.' });
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
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <OwnerSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-48 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <OwnerSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/owner')}
                  className="md:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    Owner Wallet
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Manage payouts and view your earnings
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

            {/* Section A: Balance Summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-primary/20 via-purple-500/15 to-teal-500/20 border-white/20 overflow-hidden">
                <CardContent className="p-6">
                  <div className="bg-white/80 dark:bg-black/50 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <Wallet className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Owner Wallet</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Current Balance */}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-4xl font-black bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">
                          ${(payoutCard?.balance || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total Earned: ${totalEarnings.toFixed(2)}
                        </p>
                      </div>

                      {/* Next Scheduled Payout */}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Next Scheduled Payout
                        </p>
                        {nextPending ? (
                          <div>
                            <p className="text-2xl font-bold text-amber-600">
                              ${nextPending.owner_receives.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              From: {nextPending.room?.name || 'Room reservation'}
                            </p>
                          </div>
                        ) : (
                          <p className="text-lg text-muted-foreground">No upcoming payouts</p>
                        )}
                      </div>

                      {/* Last Payout Status */}
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Last Payout Status
                        </p>
                        {lastPayout ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-semibold text-green-600">${lastPayout.owner_receives.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(lastPayout.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-lg text-muted-foreground">No payouts yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Section B & C: Two-column layout on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Section B: Payout Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payout Method (Whish Card)
                    </CardTitle>
                    <CardDescription>
                      Your default card for receiving reservation deposits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {payoutCard ? (
                      <div className="space-y-4">
                        <div className="p-4 border rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                          <div className="relative">
                            <div className="flex items-center justify-between mb-8">
                              <CardBrandIcon brand={payoutCard.brand} />
                              <Badge variant="secondary" className="bg-white/10 border-white/20 text-white">
                                Default
                              </Badge>
                            </div>
                            <p className="text-xl tracking-widest mb-4">
                              •••• •••• •••• {payoutCard.last4}
                            </p>
                            <div className="flex justify-between text-sm">
                              <div>
                                <p className="text-white/60 text-xs">EXPIRES</p>
                                <p>{payoutCard.exp_month && payoutCard.exp_year 
                                  ? `${String(payoutCard.exp_month).padStart(2, '0')}/${payoutCard.exp_year}` 
                                  : '••/••'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white/60 text-xs">COUNTRY</p>
                                <p>{payoutCard.country || 'Lebanon'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReplaceCard}
                            className="flex-1"
                          >
                            Change Card
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteModalOpen(true)}
                            className="text-destructive hover:text-destructive flex-1"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-lg border-dashed">
                        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground mb-1">
                          No payout card added yet.
                        </p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Add a Whish card to receive deposits.
                        </p>
                        <Button onClick={handleAddCard}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Payout Card
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Payout Summary
                    </CardTitle>
                    <CardDescription>
                      Overview of your earnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-600 mb-1">Completed</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${totalEarnings.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payoutHistory.filter(p => p.status === 'paid').length} payouts
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-amber-600 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-amber-600">
                          ${pendingPayouts.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payoutHistory.filter(p => p.status === 'pending').length} pending
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">Total Reservations</p>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span className="text-2xl font-bold">{payoutHistory.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Section C: Payout History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payout History</CardTitle>
                  <CardDescription>
                    All deposits from student reservations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payoutHistory.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg border-dashed">
                      <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-1">
                        No payouts processed yet.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Deposits from student reservations will appear here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Room</TableHead>
                              <TableHead>Student</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Card</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payoutHistory.map((payout) => (
                              <TableRow key={payout.id}>
                                <TableCell className="whitespace-nowrap">
                                  {format(new Date(payout.created_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{payout.room?.name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">{payout.dorm?.name || ''}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{payout.student?.full_name || 'Unknown'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">Dorm Reservation</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium text-green-600">
                                  ${payout.owner_receives.toFixed(2)}
                                </TableCell>
                                <TableCell>{getStatusBadge(payout.status)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {payoutCard ? `****${payoutCard.last4}` : '—'}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDetailsModal(payout)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden space-y-3">
                        {payoutHistory.map((payout) => (
                          <Card key={payout.id} className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{payout.room?.name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{payout.dorm?.name || ''}</p>
                              </div>
                              {getStatusBadge(payout.status)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <User className="h-3 w-3" />
                              {payout.student?.full_name || 'Unknown'}
                            </div>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-muted-foreground">You Received</p>
                                <p className="text-lg font-bold text-green-600">${payout.owner_receives.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(payout.created_at), 'MMM d, yyyy')}
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDetailsModal(payout)}
                                  className="mt-1"
                                >
                                  Details
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Mobile sticky add card button */}
            {!payoutCard && (
              <div className="md:hidden fixed bottom-20 left-4 right-4">
                <Button onClick={handleAddCard} className="w-full shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payout Card
                </Button>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payout Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your payout card? You won't be able to receive deposits from new reservations until you add a new card.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCard}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Removing...' : 'Remove Card'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Modal */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Details</DialogTitle>
            <DialogDescription>
              Full breakdown of this payout
            </DialogDescription>
          </DialogHeader>
          {detailsModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(detailsModal.created_at), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(detailsModal.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Room</p>
                  <p className="font-medium">{detailsModal.room?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dorm</p>
                  <p className="font-medium">{detailsModal.dorm?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">{detailsModal.student?.full_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-xs">{detailsModal.payment_id || detailsModal.id}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student Deposit</span>
                  <span>${detailsModal.deposit_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Roomy Fee (10%)</span>
                  <span>-${detailsModal.roomy_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>You Received</span>
                  <span className="text-green-600">${detailsModal.owner_receives.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailsModal(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
