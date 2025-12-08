import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, LogOut, Mail } from 'lucide-react';
import FluidBackground from '@/components/FluidBackground';

export default function AccountSuspended() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <FluidBackground />
      
      <Card className="w-full max-w-md text-center relative z-10">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Account Suspended</CardTitle>
          <CardDescription className="text-base">
            Your account has been suspended due to a violation of our terms of service or pending review.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p>
              If you believe this is a mistake or would like to appeal this decision, 
              please contact our support team.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => window.location.href = 'mailto:support@roomylb.com'}
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full gap-2 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
