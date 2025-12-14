import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FluidBackground from "@/components/FluidBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

type ApprovalState = "loading" | "success" | "error" | "expired";

const ApproveDevice = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ApprovalState>("loading");
  const [deviceName, setDeviceName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setState("error");
      setErrorMessage("No verification token provided.");
      return;
    }

    approveDevice(token);
  }, [searchParams]);

  const approveDevice = async (token: string) => {
    try {
      // Call the confirm-device edge function
      const { data, error } = await supabase.functions.invoke("confirm-device", {
        body: { token },
      });

      if (error) {
        console.error("Error confirming device:", error);
        setState("error");
        setErrorMessage(error.message || "Failed to verify device.");
        return;
      }

      if (data?.error) {
        if (data.code === "EXPIRED_TOKEN") {
          setState("expired");
          setErrorMessage(data.error);
        } else {
          setState("error");
          setErrorMessage(data.error);
        }
        return;
      }

      if (data?.success) {
        setDeviceName(data.deviceName || "your device");
        setState("success");
        
        // If we got an auto-login URL, use it
        if (data.autoLoginUrl) {
          // Open the magic link to complete sign-in
          window.location.href = data.autoLoginUrl;
          return;
        }

        // Otherwise, determine user role and redirect
        const userId = data.userId;
        if (userId) {
          await redirectBasedOnRole(userId);
        } else {
          // Fallback - redirect to listings page
          setTimeout(() => {
            navigate("/listings", { replace: true });
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setState("error");
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  const redirectBasedOnRole = async (userId: string) => {
    try {
      // Get user's role
      const { data: roleData, error: roleError } = await supabase.rpc("get_user_role", {
        p_user_id: userId,
      });

      if (roleError) {
        console.error("Error getting role:", roleError);
      }

      // Show success message
      toast.success("Device verified! Redirecting...");

      // Small delay to show success state
      setTimeout(() => {
        if (roleData === "owner") {
          navigate("/owner", { replace: true });
        } else if (roleData === "admin") {
          navigate("/admin", { replace: true });
        } else if (roleData === "student") {
          navigate("/intro", { replace: true });
        } else {
          // No role yet - go to listings
          navigate("/listings", { replace: true });
        }
      }, 1500);
    } catch (err) {
      console.error("Error redirecting:", err);
      navigate("/listings", { replace: true });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <FluidBackground />
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-xl border-border/50 shadow-2xl">
        <CardContent className="pt-8 pb-8">
          {state === "loading" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Verifying Device</h2>
              <p className="text-muted-foreground">Please wait while we verify your device...</p>
            </div>
          )}

          {state === "success" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Device Verified!</h2>
              <p className="text-muted-foreground">
                {deviceName} has been approved. Redirecting you to your dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing you in...</span>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Verification Failed</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <div className="space-y-2 pt-4">
                <Button onClick={() => navigate("/listings")} className="w-full">
                  Go to Listings
                </Button>
              </div>
            </div>
          )}

          {state === "expired" && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Link Expired</h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <div className="space-y-2 pt-4">
                <Button onClick={() => navigate("/listings")} className="w-full">
                  Go to Listings
                </Button>
                <p className="text-xs text-muted-foreground">
                  You'll receive a new verification email when you log in.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApproveDevice;
