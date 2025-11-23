import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldOff, ArrowLeft } from 'lucide-react';

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setStudents(data);
      
      // Load roles for all users
      const userIds = data.map(s => s.user_id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role_id, roles(name)')
        .in('user_id', userIds);
      
      const rolesMap: Record<string, string[]> = {};
      rolesData?.forEach(r => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        const roleName = (r.roles as any)?.name;
        if (roleName) rolesMap[r.user_id].push(roleName);
      });
      setUserRoles(rolesMap);
    }
    setLoading(false);
  };

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-elevation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          target_user_id: userId,
          elevate: !currentlyAdmin
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update admin status');
      }

      toast({
        title: 'Success',
        description: result.message,
      });

      loadStudents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold gradient-text">Students Overview</h1>
          <p className="text-foreground/60 mt-2">View all registered students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-hover rounded-2xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Total Students</p>
          <p className="text-3xl font-bold">{students.length}</p>
        </div>
        <div className="glass-hover rounded-2xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Avg Budget</p>
          <p className="text-3xl font-bold">
            ${Math.round(students.reduce((sum, s) => sum + (Number(s.budget) || 0), 0) / students.length || 0)}
          </p>
        </div>
        <div className="glass-hover rounded-2xl p-6">
          <p className="text-sm text-foreground/60 mb-1">Looking for Roommate</p>
          <p className="text-3xl font-bold">
            {students.filter(s => s.roommate_needed).length}
          </p>
        </div>
      </div>

      <div className="glass-hover rounded-2xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Roommate</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const roles = userRoles[student.user_id] || [];
              const isAdmin = roles.includes('admin');
              
              return (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.age || 'N/A'}</TableCell>
                  <TableCell>{student.university || 'Not specified'}</TableCell>
                  <TableCell>${student.budget || 'N/A'}</TableCell>
                  <TableCell>{student.room_type || 'Any'}</TableCell>
                  <TableCell>
                    <Badge variant={student.roommate_needed ? 'default' : 'secondary'}>
                      {student.roommate_needed ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {roles.map(role => (
                        <Badge key={role} variant={role === 'admin' ? 'destructive' : 'default'}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={isAdmin ? 'destructive' : 'default'}
                      onClick={() => handleToggleAdmin(student.user_id, isAdmin)}
                    >
                      {isAdmin ? (
                        <>
                          <ShieldOff className="w-4 h-4 mr-1" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-1" />
                          Make Admin
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
