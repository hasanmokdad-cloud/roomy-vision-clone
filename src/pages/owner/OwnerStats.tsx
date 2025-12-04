import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OwnerStats() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-semibold text-gray-800">Statistics</h1>
            <p className="text-gray-500 text-sm mt-1">View your performance metrics</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Statistics Dashboard</h3>
                <p className="text-gray-500">
                  Detailed analytics and performance metrics coming soon...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </OwnerLayout>
  );
}