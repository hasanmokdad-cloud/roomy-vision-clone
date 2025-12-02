import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Trash2, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/shared/Navbar';
import BottomNav from '@/components/BottomNav';

interface PaymentMethod {
  id: string;
  student_id: string;
  whish_token: string;
  brand: string;
  last4: string;
  is_default: boolean;
  created_at: string;
}

export default function Wallet() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { loading, userId } = useAuthGuard();
  const isMobile = useIsMobile();
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<PaymentMethod | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && userId) {
      loadPaymentMethods();
    }
  }, [loading, userId]);

  useEffect(() => {
    // Show toast if redirected after adding card
    if (searchParams.get('status') === 'card_added') {
      toast({
        title: 'Card Added',
        description: 'Your Whish card has been saved successfully.',
      });
    }
  }, [searchParams, toast]);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      // Get student ID first
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!student) {
        toast({
          title: 'Error',
          description: 'Student profile not found',
          variant: 'destructive',
        });
        return;
      }

      setStudentId(student.id);

      // Load payment methods
      const { data: methods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(methods || []);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = () => {
    if (!studentId) return;
    navigate(`/mock-whish-add-card?studentId=${studentId}`);
  };

  const handleSetDefault = async (card: PaymentMethod) => {
    if (!studentId || card.is_default) return;
    
    setIsSettingDefault(card.id);
    try {
      // Set all cards to non-default
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('student_id', studentId);

      // Set selected card as default
      await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', card.id);

      toast({
        title: 'Default card updated',
        description: 'Your payment preference has been saved.',
      });

      loadPaymentMethods();
    } catch (error) {
      console.error('Error setting default card:', error);
      toast({
        title: 'Error',
        description: 'Failed to update default card',
        variant: 'destructive',
      });
    } finally {
      setIsSettingDefault(null);
    }
  };

  const openDeleteModal = (card: PaymentMethod) => {
    setCardToDelete(card);
    setDeleteModalOpen(true);
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete || !studentId) return;

    setIsDeleting(true);
    try {
      const wasDefault = cardToDelete.is_default;
      
      // Delete the card
      await supabase
        .from('payment_methods')
        .delete()
        .eq('id', cardToDelete.id);

      // If deleted card was default, set another card as default
      if (wasDefault) {
        const remainingCards = paymentMethods.filter(c => c.id !== cardToDelete.id);
        if (remainingCards.length > 0) {
          await supabase
            .from('payment_methods')
            .update({ is_default: true })
            .eq('id', remainingCards[0].id);
        }
      }

      toast({
        title: 'Card removed',
        description: 'Your payment method has been deleted.',
      });

      setDeleteModalOpen(false);
      setCardToDelete(null);
      loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove card',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {!isMobile && <Navbar />}

      <div className="container mx-auto px-4 py-8 pt-24 pb-32 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/settings')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text">My Wallet</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Whish cards & payment preferences
          </p>
        </div>

        {/* Add Card Button */}
        <Button
          onClick={handleAddCard}
          className="w-full mb-6 h-14 text-lg bg-gradient-to-r from-primary to-purple-600"
          disabled={!studentId}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Whish Card
        </Button>

        {/* Saved Payment Methods */}
        <Card className="border border-border/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Saved Payment Methods
            </CardTitle>
            <CardDescription>
              Your saved Whish cards for faster checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No saved cards</p>
                <p className="text-sm mt-1">
                  Add a Whish card to make future payments faster.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    style={{
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {card.brand || 'Card'} •••• {card.last4}
                          </span>
                          {card.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="w-3 h-3 mr-1 fill-current" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(card.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!card.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(card)}
                          disabled={isSettingDefault === card.id}
                        >
                          {isSettingDefault === card.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Set Default'
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(card)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isMobile && <BottomNav />}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this card?</DialogTitle>
            <DialogDescription>
              You won't be able to use this card for payments anymore. 
              {cardToDelete?.is_default && paymentMethods.length > 1 && (
                <span className="block mt-2 text-amber-600">
                  Another card will be set as your default payment method.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCard}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
