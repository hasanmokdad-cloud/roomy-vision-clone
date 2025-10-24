import { useEffect, useState } from 'react';
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

export default function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-12">Loading students...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Students Overview</h1>
        <p className="text-foreground/60 mt-2">View all registered students</p>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
