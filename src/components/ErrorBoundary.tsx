import React, { Component, ReactNode } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallbackUI?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRedirecting: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isRedirecting: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = async () => {
    this.setState({ isRedirecting: true });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data } = await supabase.rpc('get_user_role', { 
          p_user_id: session.user.id 
        });
        
        if (data === 'owner') {
          window.location.href = '/owner';
          return;
        } else if (data === 'admin') {
          window.location.href = '/admin';
          return;
        }
      }
      
      window.location.href = '/listings';
    } catch {
      window.location.href = '/listings';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackUI) {
        return this.props.fallbackUI;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full glass-hover">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
              <p className="text-foreground/60 mb-6">
                Don't worry, we've logged the issue and our team will look into it.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-destructive/10 rounded-lg text-left">
                  <p className="text-sm font-mono text-destructive break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  disabled={this.state.isRedirecting}
                >
                  <Home className="w-4 h-4 mr-2" />
                  {this.state.isRedirecting ? 'Redirecting...' : 'Go Home'}
                </Button>
              </div>

              <div className="mt-6">
                <a
                  href="/contact"
                  className="text-sm text-primary hover:underline"
                >
                  Report this issue
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
