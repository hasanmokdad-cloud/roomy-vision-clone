import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, UserX, Mail, Building2, MapPin, Upload, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface Dorm {
  id: string;
  name: string;
  dorm_name: string | null;
  area: string | null;
  location: string;
  phone_number: string | null;
  email: string | null;
  owner_id: string | null;
  owner?: {
    email: string;
    full_name: string;
  };
}

interface Owner {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
}

export default function AdminDormOwnership() {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchDorm, setSearchDorm] = useState('');
  const [searchOwner, setSearchOwner] = useState('');
  const [selectedDorm, setSelectedDorm] = useState<Dorm | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load dorms with owner info
      const { data: dormsData, error: dormsError } = await supabase
        .from('dorms')
        .select(`
          id,
          name,
          dorm_name,
          area,
          location,
          phone_number,
          email,
          owner_id
        `)
        .order('name', { ascending: true });

      if (dormsError) throw dormsError;

      // Load owner details for dorms that have owners
      const dormsWithOwners = await Promise.all(
        (dormsData || []).map(async (dorm) => {
          if (dorm.owner_id) {
            const { data: ownerData } = await supabase
              .from('owners')
              .select('email, full_name')
              .eq('id', dorm.owner_id)
              .single();
            
            return { ...dorm, owner: ownerData };
          }
          return dorm;
        })
      );

      setDorms(dormsWithOwners);

      // Load all owners
      const { data: ownersData, error: ownersError } = await supabase
        .from('owners')
        .select('id, user_id, email, full_name')
        .order('full_name', { ascending: true });

      if (ownersError) throw ownersError;
      setOwners(ownersData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOwner = async (ownerId: string) => {
    if (!selectedDorm) return;

    try {
      const { error } = await supabase
        .from('dorms')
        .update({ owner_id: ownerId })
        .eq('id', selectedDorm.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Owner assigned to dorm successfully',
      });

      setAssignDialogOpen(false);
      setSelectedDorm(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemoveOwner = async (dormId: string) => {
    try {
      const { error } = await supabase
        .from('dorms')
        .update({ owner_id: null })
        .eq('id', dormId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Owner removed from dorm',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCSV(true);
    setBulkResults(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      
      // Validate CSV format (dorm_id,owner_email)
      const header = lines[0].toLowerCase();
      if (!header.includes('dorm_id') || !header.includes('owner_email')) {
        throw new Error('Invalid CSV format. Expected headers: dorm_id,owner_email');
      }

      const assignments = lines.slice(1).map(line => {
        const [dormId, ownerEmail] = line.split(',').map(s => s.trim());
        return { dormId, ownerEmail };
      });

      let successful = 0;
      let failed = 0;
      const errors: any[] = [];

      // Get current user for audit logging
      const { data: { user } } = await supabase.auth.getUser();

      for (const { dormId, ownerEmail } of assignments) {
        try {
          // Find owner by email
          const { data: owner } = await supabase
            .from('owners')
            .select('id')
            .eq('email', ownerEmail)
            .single();

          if (!owner) {
            throw new Error(`Owner not found: ${ownerEmail}`);
          }

          // Assign owner to dorm
          const { error } = await supabase
            .from('dorms')
            .update({ owner_id: owner.id })
            .eq('id', dormId);

          if (error) throw error;
          successful++;
        } catch (err: any) {
          failed++;
          errors.push({ dormId, ownerEmail, error: err.message });
        }
      }

      // Log bulk assignment
      await supabase.from('bulk_dorm_assignments').insert({
        admin_user_id: user?.id,
        total_rows: assignments.length,
        successful_assignments: successful,
        failed_assignments: failed,
        errors: errors,
        csv_filename: file.name,
      });

      setBulkResults({ successful, failed, errors, total: assignments.length });

      toast({
        title: 'Bulk Assignment Complete',
        description: `${successful} successful, ${failed} failed`,
      });

      if (successful > 0) {
        loadData();
      }
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingCSV(false);
      e.target.value = '';
    }
  };

  const downloadCSVTemplate = () => {
    const template = 'dorm_id,owner_email\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_assignment_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredDorms = dorms.filter(dorm => {
    const dormName = (dorm.dorm_name || dorm.name || '').toLowerCase();
    const area = (dorm.area || dorm.location || '').toLowerCase();
    const search = searchDorm.toLowerCase();
    return dormName.includes(search) || area.includes(search);
  });

  const filteredOwners = owners.filter(owner => {
    const name = owner.full_name.toLowerCase();
    const email = owner.email.toLowerCase();
    const search = searchOwner.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Dorm Ownership Management</h1>
            <p className="text-foreground/60">Assign and manage dorm owners</p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dorms by name or area..."
                  value={searchDorm}
                  onChange={(e) => setSearchDorm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bulk Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCSVTemplate}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  disabled={uploadingCSV}
                  className="relative"
                >
                  <label className="cursor-pointer flex items-center gap-2">
                    {uploadingCSV ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload CSV
                      </>
                    )}
                    <input
                      type="file"
                      hidden
                      accept=".csv"
                      onChange={handleCSVUpload}
                      disabled={uploadingCSV}
                    />
                  </label>
                </Button>
              </div>

              {bulkResults && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{bulkResults.successful} Successful</Badge>
                    {bulkResults.failed > 0 && (
                      <Badge variant="destructive">{bulkResults.failed} Failed</Badge>
                    )}
                  </div>
                  
                  {bulkResults.errors.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">
                        View errors ({bulkResults.errors.length})
                      </summary>
                      <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                        {bulkResults.errors.map((err: any, i: number) => (
                          <div key={i} className="text-xs text-destructive">
                            {err.dormId}: {err.error}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Dorms</p>
                    <p className="text-2xl font-bold">{dorms.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned</p>
                    <p className="text-2xl font-bold">
                      {dorms.filter(d => d.owner_id).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <UserX className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                    <p className="text-2xl font-bold">
                      {dorms.filter(d => !d.owner_id).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dorms List */}
          <div className="space-y-4">
            {filteredDorms.map((dorm) => (
              <Card key={dorm.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {dorm.dorm_name || dorm.name}
                        {dorm.owner_id ? (
                          <Badge variant="default" className="bg-green-500">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <UserX className="w-3 h-3 mr-1" />
                            Unassigned
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {dorm.area || dorm.location}
                        </div>
                        {dorm.phone_number && (
                          <div>📞 {dorm.phone_number}</div>
                        )}
                      </div>
                      {dorm.owner && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Mail className="w-4 h-4 text-primary" />
                          <span className="font-medium">{dorm.owner.full_name}</span>
                          <span className="text-muted-foreground">({dorm.owner.email})</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Dialog
                        open={assignDialogOpen && selectedDorm?.id === dorm.id}
                        onOpenChange={(open) => {
                          setAssignDialogOpen(open);
                          if (!open) setSelectedDorm(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDorm(dorm)}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            {dorm.owner_id ? 'Change Owner' : 'Assign Owner'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Assign Owner to {dorm.dorm_name || dorm.name}</DialogTitle>
                            <DialogDescription>
                              Search and select an owner to assign to this dorm
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label>Search Owners</Label>
                              <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search by name or email..."
                                  value={searchOwner}
                                  onChange={(e) => setSearchOwner(e.target.value)}
                                  className="pl-9"
                                />
                              </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {filteredOwners.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No owners found
                                </p>
                              ) : (
                                filteredOwners.map((owner) => (
                                  <Button
                                    key={owner.id}
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleAssignOwner(owner.id)}
                                  >
                                    <Mail className="w-4 h-4 mr-2" />
                                    <div className="text-left">
                                      <div className="font-medium">{owner.full_name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {owner.email}
                                      </div>
                                    </div>
                                  </Button>
                                ))
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {dorm.owner_id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOwner(dorm.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserX className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {filteredDorms.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No dorms found matching your search
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
