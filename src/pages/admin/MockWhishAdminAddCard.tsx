import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CreditCard,
  Shield,
  Loader2,
} from "lucide-react";
import {
  CardBrandIcon,
  detectCardBrand,
  validateCardNumber,
  formatCardNumber,
  getCvvLength,
} from "@/components/payments/CardBrandIcons";
import { ExpirationPicker } from "@/components/payments/ExpirationPicker";

const COUNTRIES = [
  "Lebanon",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jordan",
  "Egypt",
  "United States",
  "United Kingdom",
  "France",
  "Germany",
];

export default function MockWhishAdminAddCard() {
  const { loading: roleLoading } = useRoleGuard("admin");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [country, setCountry] = useState("Lebanon");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const detectedBrand = detectCardBrand(cardNumber);
  const isCardValid = validateCardNumber(cardNumber);
  const cvvLength = getCvvLength(detectedBrand);

  const isFormValid =
    isCardValid &&
    expMonth &&
    expYear &&
    cvv.length >= 3 &&
    country;

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, cvvLength);
    setCvv(value);
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const last4 = cardNumber.replace(/\s/g, "").slice(-4);
      const mockToken = `admin_tok_${Date.now()}_${last4}`;

      // Check if admin already has a wallet entry
      const { data: existingWallet } = await supabase
        .from("admin_wallet")
        .select("id")
        .eq("admin_id", user.id)
        .single();

      if (existingWallet) {
        // Update existing
        const { error } = await supabase
          .from("admin_wallet")
          .update({
            whish_token: mockToken,
            card_last4: last4,
            card_brand: detectedBrand,
            card_country: country,
            exp_month: parseInt(expMonth),
            exp_year: parseInt(expYear),
            updated_at: new Date().toISOString(),
          })
          .eq("admin_id", user.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("admin_wallet")
          .insert({
            admin_id: user.id,
            whish_token: mockToken,
            card_last4: last4,
            card_brand: detectedBrand,
            card_country: country,
            exp_month: parseInt(expMonth),
            exp_year: parseInt(expYear),
            balance: 0,
          });

        if (error) throw error;
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Payout Card Added",
        message: `Your ${detectedBrand.toUpperCase()} card ending in ${last4} has been added for commission payouts.`,
        metadata: { category: "payout" },
      });

      toast({
        title: "Card Added Successfully",
        description: `Your ${detectedBrand.toUpperCase()} card has been saved.`,
      });

      navigate("/admin/wallet?status=card_added");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-b from-background to-muted/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/wallet")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold gradient-text">Add Admin Payout Card</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <Card className="border-2">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <CardTitle>Add Admin Payout Whish Card</CardTitle>
            <p className="text-sm text-foreground/60">
              Platform commissions will be transferred to this card automatically.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Card Number */}
            <div className="space-y-2">
              <Label>Card Number</Label>
              <div className="relative">
                <Input
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  className={`pr-12 font-mono ${
                    cardNumber && !isCardValid ? "border-red-500" : ""
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <CardBrandIcon brand={detectedBrand} />
                </div>
              </div>
              {cardNumber && !isCardValid && (
                <p className="text-xs text-red-500">Invalid card number</p>
              )}
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start font-mono"
                onClick={() => setIsPickerOpen(true)}
              >
                {expMonth && expYear
                  ? `${expMonth}/${expYear}`
                  : "MM/YYYY"}
              </Button>
            </div>

            {/* CVV */}
            <div className="space-y-2">
              <Label>CVV</Label>
              <Input
                type="password"
                placeholder={cvvLength === 4 ? "••••" : "•••"}
                value={cvv}
                onChange={handleCvvChange}
                maxLength={cvvLength}
                className="font-mono"
              />
              <p className="text-xs text-foreground/60">
                {cvvLength} digits on the back of your card
              </p>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-700">Secure & Encrypted</p>
                <p className="text-green-600/80">
                  Your card details are securely encrypted and stored.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full bg-gradient-to-r from-primary to-purple-500 text-white"
              size="lg"
              disabled={!isFormValid || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding Card...
                </>
              ) : (
                "Add Payout Card"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Picker Modal */}
      <ExpirationPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(month, year) => {
          setExpMonth(month);
          setExpYear(year);
        }}
        initialMonth={expMonth}
        initialYear={expYear}
      />
    </motion.div>
  );
}