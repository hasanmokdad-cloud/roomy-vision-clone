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
import { ArrowLeft, Eye, Edit, Ban, Trash2 } from 'lucide-react';
import { StudentProfileModal } from '@/components/admin/StudentProfileModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
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
    }
    setLoading(false);
  };

  const handleSuspendStudent = async (studentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    const { error } = await supabase
      .from('students')
      .update({ status: newStatus })
      .eq('id', studentId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update student status',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `Student ${newStatus === 'suspended' ? 'suspended' : 'activated'} successfully`,
    });

    loadStudents();
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentToDelete);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: 'Student deleted successfully',
    });

    setDeleteDialogOpen(false);
    setStudentToDelete(null);
    loadStudents();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 md:p-8 text-center">Loading students...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Students Overview</h1>
              <p className="text-muted-foreground mt-1">View all registered students</p>
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
              <TableHead>Status</TableHead>
              <TableHead>Date Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
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
                  <Badge variant={student.status === 'active' ? 'default' : 'destructive'}>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(student.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setProfileModalOpen(true);
                      }}
                      title="View Profile"
                    >
                      <Eye className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSuspendStudent(student.id, student.status)}
                      title={student.status === 'active' ? 'Suspend' : 'Activate'}
                    >
                      <Ban className={`w-4 h-4 ${student.status === 'active' ? 'text-orange-500' : 'text-green-500'}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setStudentToDelete(student.id);
                        setDeleteDialogOpen(true);
                      }}
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Student Profile Modal */}
      {selectedStudentId && (
        <StudentProfileModal
          studentId={selectedStudentId}
          isOpen={profileModalOpen}
          onClose={() => {
            setProfileModalOpen(false);
            setSelectedStudentId(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student account
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </div>
      </div>
    </AdminLayout>
  );
}
