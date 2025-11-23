import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminRLSDebugger() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rlsErrors, setRlsErrors] = useState<any[]>([]);
  const [authState, setAuthState] = useState<any>(null);
  const [realtimeErrors, setRealtimeErrors] = useState<any[]>([]);

  // Fetch RLS errors
  const fetchRlsErrors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rls_errors_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRlsErrors(data || []);
    } catch (error: any) {
      console.error('Error fetching RLS errors:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch RLS errors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get current auth state
  const checkAuthState = async () => {
    try {
      const { data, error } = await supabase.rpc('debug_auth_state');
      
      if (error) throw error;
      setAuthState(data);
    } catch (error: any) {
      console.error('Error checking auth state:', error);
    }
  };

  // Subscribe to real-time RLS errors
  useEffect(() => {
    fetchRlsErrors();
    checkAuthState();

    const channel = supabase
      .channel('rls-errors')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rls_errors_log'
        },
        (payload) => {
          setRealtimeErrors(prev => [payload.new, ...prev].slice(0, 50));
          toast({
            title: 'New RLS Error Detected',
            description: `Table: ${payload.new.table_name}, Operation: ${payload.new.operation}`,
            variant: 'destructive',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const ErrorCard = ({ error }: { error: any }) => (
    <Card className="p-4 mb-2 border-destructive/50">
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-destructive mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="destructive">{error.operation}</Badge>
            <Badge variant="outline">{error.table_name}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(error.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm mb-2">{error.error_message}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">User ID:</span>{' '}
              <code className="bg-muted px-1 py-0.5 rounded">
                {error.user_id || 'NULL'}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">Auth UID:</span>{' '}
              <code className="bg-muted px-1 py-0.5 rounded">
                {error.auth_uid || 'NULL'}
              </code>
            </div>
          </div>
          {error.jwt_claims && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                View JWT Claims
              </summary>
              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                {JSON.stringify(error.jwt_claims, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            RLS Security Debugger
          </h1>
          <p className="text-muted-foreground">
            Monitor and debug Row Level Security policies and authentication issues
          </p>
        </div>
        <Button onClick={fetchRlsErrors} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="errors" className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="errors">
            <AlertCircle className="w-4 h-4 mr-2" />
            Errors
          </TabsTrigger>
          <TabsTrigger value="realtime">
            <Activity className="w-4 h-4 mr-2" />
            Live
          </TabsTrigger>
          <TabsTrigger value="auth">
            <Users className="w-4 h-4 mr-2" />
            Auth
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Database className="w-4 h-4 mr-2" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="failing">
            <XCircle className="w-4 h-4 mr-2" />
            Failing
          </TabsTrigger>
          <TabsTrigger value="restricted">
            <Shield className="w-4 h-4 mr-2" />
            Restricted
          </TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent RLS Errors</h3>
            {rlsErrors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No RLS errors detected. System is healthy!</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                {rlsErrors.map((error) => (
                  <ErrorCard key={error.id} error={error} />
                ))}
              </ScrollArea>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="realtime">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Live Error Monitor</h3>
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" />
                Active
              </Badge>
            </div>
            {realtimeErrors.length === 0 ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Monitoring for real-time RLS errors. New errors will appear here instantly.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="h-[600px]">
                {realtimeErrors.map((error, idx) => (
                  <ErrorCard key={idx} error={error} />
                ))}
              </ScrollArea>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="auth">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Current Authentication State</h3>
            <Button 
              onClick={checkAuthState} 
              variant="outline" 
              size="sm" 
              className="mb-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Auth State
            </Button>
            
            {authState ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Auth UID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {authState.auth_uid || 'NULL'}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Roles</p>
                    <div className="flex gap-1">
                      {authState.roles?.map((role: string) => (
                        <Badge key={role} variant="secondary">{role}</Badge>
                      )) || <span className="text-sm text-muted-foreground">No roles</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Owner ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {authState.owner_id || 'N/A'}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Student ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {authState.student_id || 'N/A'}
                    </code>
                  </div>
                </div>

                {authState.jwt_claims && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">JWT Claims</p>
                    <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                      {JSON.stringify(authState.jwt_claims, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Click refresh to check current auth state</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Total Errors
              </h4>
              <p className="text-3xl font-bold">{rlsErrors.length}</p>
            </Card>
            <Card className="p-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Most Common Table
              </h4>
              <p className="text-3xl font-bold">
                {rlsErrors.length > 0
                  ? rlsErrors
                      .reduce((acc: any, e) => {
                        acc[e.table_name] = (acc[e.table_name] || 0) + 1;
                        return acc;
                      }, {})
                      ? Object.entries(
                          rlsErrors.reduce((acc: any, e) => {
                            acc[e.table_name] = (acc[e.table_name] || 0) + 1;
                            return acc;
                          }, {})
                        ).sort((a: any, b: any) => b[1] - a[1])[0][0]
                      : 'N/A'
                  : 'N/A'}
              </p>
            </Card>
            <Card className="p-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Errors Today
              </h4>
              <p className="text-3xl font-bold">
                {
                  rlsErrors.filter(
                    (e) =>
                      new Date(e.created_at).toDateString() ===
                      new Date().toDateString()
                  ).length
                }
              </p>
            </Card>
          </div>

          <Card className="p-6 mt-4">
            <h3 className="text-lg font-semibold mb-4">Errors by Table</h3>
            <div className="space-y-2">
              {Object.entries(
                rlsErrors.reduce((acc: any, e) => {
                  acc[e.table_name] = (acc[e.table_name] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([table, count]: any) => (
                  <div key={table} className="flex items-center justify-between">
                    <span className="text-sm">{table}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="failing">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tables Failing RLS</h3>
            <div className="space-y-2">
              {Object.entries(
                rlsErrors.reduce((acc: any, e) => {
                  acc[e.table_name] = (acc[e.table_name] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([table, count]: any) => (
                  <div key={table} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                    <div>
                      <p className="font-semibold">{table}</p>
                      <p className="text-sm text-muted-foreground">
                        {count} error{count > 1 ? 's' : ''} detected
                      </p>
                    </div>
                    <Badge variant="destructive">{count}</Badge>
                  </div>
                ))}
              {Object.keys(rlsErrors).length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No tables with RLS errors
                </p>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="restricted">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Last 20 Restricted Queries</h3>
            <ScrollArea className="h-[600px]">
              {rlsErrors.slice(0, 20).map((error) => (
                <Card key={error.id} className="p-3 mb-2 border-l-4 border-l-destructive">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-destructive mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{error.operation}</Badge>
                        <Badge variant="outline">{error.table_name}</Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(error.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{error.error_message}</p>
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <span className="text-muted-foreground">User:</span>{' '}
                        <code>{error.user_id || 'NULL'}</code>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
