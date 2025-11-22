import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Users, TrendingUp, CheckCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { dormDataFromExcel } from '@/utils/excelParser';
import { useAdminDormsQuery } from '@/hooks/useAdminDormsQuery';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';
import { EngagementChart } from '@/components/admin/EngagementChart';
import { PendingApprovalsQueue } from '@/components/admin/PendingApprovalsQueue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminHome() {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { data: dorms, refetch: refetchDorms } = useAdminDormsQuery();
  const [stats, setStats] = useState({
    totalDorms: 0,
    verifiedDorms: 0,
    totalStudents: 0,
    avgBudget: 0,
  });

  useEffect(() => {
    loadStats();
  }, [dorms]);

  const loadStats = async () => {
    const { data: studentsRes } = await supabase
      .from('students')
      .select('budget', { count: 'exact' });

    const verifiedCount = dorms?.filter(
      d => d.verification_status === 'Verified'
    ).length || 0;

    const avgBudget = studentsRes?.reduce((sum, s) => sum + (Number(s.budget) || 0), 0) / 
      (studentsRes?.length || 1) || 0;

    setStats({
      totalDorms: dorms?.length || 0,
      verifiedDorms: verifiedCount,
      totalStudents: studentsRes?.length || 0,
      avgBudget: Math.round(avgBudget),
    });
  };

  const handleImportDorms = async () => {
    setImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('import-dorms-data', {
        body: { dormsData: dormDataFromExcel }
      });

      if (error) throw error;

      toast({
        title: '✅ Import Successful!',
        description: `${data.message}. Total dorms in database: ${data.totalInDatabase}`,
      });
      
      // Reload stats
      await refetchDorms();
      loadStats();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error.message || 'An error occurred during import',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const statCards = [
    { title: 'Total Dorms', value: stats.totalDorms, icon: Building2, color: 'from-blue-500 to-cyan-500' },
    { title: 'Verified Dorms', value: stats.verifiedDorms, icon: CheckCircle, color: 'from-green-500 to-emerald-500' },
    { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'from-purple-500 to-pink-500' },
    { title: 'Avg Budget', value: `$${stats.avgBudget}`, icon: TrendingUp, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
        <p className="text-foreground/60 mt-2">Welcome to Roomy's admin management portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-hover rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground/60 mb-1">{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserGrowthChart />
        <EngagementChart />
      </div>

      {/* Pending Approvals */}
      <PendingApprovalsQueue />

      <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={importing}
                className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-4 text-left transition-all hover:shadow-lg disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Upload className="w-5 h-5" />
                  <h3 className="font-semibold">Import Excel Data</h3>
                </div>
                <p className="text-sm text-white/80">
                  {importing ? 'Importing...' : 'Import 25 verified dorms'}
                </p>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Import Dorm Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will import 25 verified dorms from the Excel database.
                  All entries will be marked as verified and available for public viewing.
                  <br /><br />
                  <strong>Note:</strong> This operation will add new dorms to the database.
                  Existing dorms will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleImportDorms}>
                  Confirm Import
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <button className="bg-gray-100 hover:bg-gray-200 rounded-xl p-4 text-left transition-all">
            <h3 className="font-semibold mb-1">Verify Listings</h3>
            <p className="text-sm text-foreground/60">Review pending dorms</p>
          </button>
          <button className="bg-gray-100 hover:bg-gray-200 rounded-xl p-4 text-left transition-all">
            <h3 className="font-semibold mb-1">View Analytics</h3>
            <p className="text-sm text-foreground/60">Check platform insights</p>
          </button>
        </div>
      </div>
    </div>
  );
}
