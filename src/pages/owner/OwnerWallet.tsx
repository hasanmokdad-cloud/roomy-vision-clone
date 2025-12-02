import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Wallet, Plus, Trash2, RefreshCw, Eye, Building2, User } from 'lucide-react';
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

interface PayoutCard {
  id: string;
  owner_id: string;
  whish_token: string;
  brand: string;
  last4: string;
  is_default: boolean;
  created_at: string;
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
      // Clear the URL param
      window.history.replaceState({}, '', '/owner/wallet');
    }
  }, [searchParams, toast]);

  const loadOwnerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get owner record
      const { data: owner } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!owner) return;
      setOwnerId(owner.id);

      // Load payout card
      const { data: cards } = await supabase
        .from('owner_payment_methods')
        .select('*')
        .eq('owner_id', owner.id)
        .eq('is_default', true)
        .limit(1);

      if (cards && cards.length > 0) {
        setPayoutCard(cards[0]);
      }

      // Load payout history with related data
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

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <OwnerSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-32 w-full mb-6" />
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
            className="max-w-4xl mx-auto space-y-6"
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
                    Manage your Whish payout card and view your payouts
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

            {/* Payout Card Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payout Card
                </CardTitle>
                <CardDescription>
                  Your default card for receiving room reservation deposits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payoutCard ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-gradient-to-r from-primary to-primary/70 rounded flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {payoutCard.brand} •••• {payoutCard.last4}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          Default Payout Card
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReplaceCard}
                        className="flex-1 sm:flex-none"
                      >
                        Replace Card
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteModalOpen(true)}
                        className="text-destructive hover:text-destructive flex-1 sm:flex-none"
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
                      You have not added a payout card yet.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a Whish card to receive room reservation deposits.
                    </p>
                    <Button onClick={handleAddCard}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Payout Card
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payout History Section */}
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>
                  All deposits you've received from student reservations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payoutHistory.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg border-dashed">
                    <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-1">
                      You have no payouts yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Deposits you receive from student reservations will appear here.
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
                            <TableHead className="text-right">Deposit</TableHead>
                            <TableHead className="text-right">Roomy Fee</TableHead>
                            <TableHead className="text-right">You Received</TableHead>
                            <TableHead>Status</TableHead>
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
                              <TableCell className="text-right">${payout.deposit_amount.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-destructive">-${payout.roomy_fee.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-medium text-green-600">${payout.owner_receives.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={payout.status === 'paid' ? 'default' : 'destructive'}>
                                  {payout.status}
                                </Badge>
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
                            <Badge variant={payout.status === 'paid' ? 'default' : 'destructive'}>
                              {payout.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="h-3 w-3" />
                            {payout.student?.full_name || 'Unknown'}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                            <div>
                              <p className="text-muted-foreground text-xs">Deposit</p>
                              <p className="font-medium">${payout.deposit_amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Fee</p>
                              <p className="font-medium text-destructive">-${payout.roomy_fee.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Received</p>
                              <p className="font-medium text-green-600">${payout.owner_receives.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(payout.created_at), 'MMM d, yyyy')}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailsModal(payout)}
                            >
                              View Details
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
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
              Full details for this payout
            </DialogDescription>
          </DialogHeader>
          {detailsModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(detailsModal.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={detailsModal.status === 'paid' ? 'default' : 'destructive'}>
                    {detailsModal.status}
                  </Badge>
                </div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student Deposit</span>
                  <span>${detailsModal.deposit_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Roomy Fee (10%)</span>
                  <span>-${detailsModal.roomy_fee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-medium text-green-600">
                  <span>You Received</span>
                  <span>${detailsModal.owner_receives.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {detailsModal.room?.name} at {detailsModal.dorm?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{detailsModal.student?.full_name}</span>
                </div>
              </div>

              {detailsModal.payment_id && (
                <div>
                  <p className="text-xs text-muted-foreground">Payment ID</p>
                  <p className="text-xs font-mono">{detailsModal.payment_id}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModal(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
