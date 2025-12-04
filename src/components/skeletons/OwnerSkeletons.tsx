import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { OwnerLayout } from '@/components/owner/OwnerLayout';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function OwnerDashboardSkeleton() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-2">
            <Skeleton className="h-9 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl shadow-md p-5 bg-card">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Action Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-xl shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Upcoming Tours */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-40" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}

export function OwnerTableSkeleton() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-36 rounded-xl" />
          </motion.div>

          {/* Table */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl shadow-md overflow-hidden">
              <div className="p-4 space-y-4">
                {/* Table Header */}
                <div className="flex gap-4 border-b border-border/40 pb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-4 flex-1" />
                  ))}
                </div>
                {/* Table Rows */}
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="flex gap-4 py-3">
                    {[1, 2, 3, 4, 5].map((cell) => (
                      <Skeleton key={cell} className="h-5 flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}

export function OwnerCardListSkeleton() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </motion.div>

          {/* Cards Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="rounded-2xl shadow-md">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}

export function OwnerCalendarSkeleton() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants}>
            <Skeleton className="h-10 w-80 rounded-lg" />
          </motion.div>

          {/* Calendar + List */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-5">
                <Skeleton className="h-[300px] w-full rounded-xl" />
              </CardContent>
            </Card>

            {/* Bookings List */}
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-5 space-y-4">
                <Skeleton className="h-6 w-48" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-muted/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1 rounded-lg" />
                      <Skeleton className="h-8 flex-1 rounded-lg" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}

export function OwnerFormSkeleton() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-6 space-y-6">
                {/* Form Fields */}
                {[1, 2, 3, 4].map((section) => (
                  <div key={section} className="space-y-4">
                    <Skeleton className="h-5 w-32" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2].map((field) => (
                        <div key={field} className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Submit Button */}
                <Skeleton className="h-11 w-full rounded-xl" />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}

export function OwnerMetricsSkeleton() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </motion.div>

          {/* Metrics Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="rounded-2xl shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((bar) => (
                      <div key={bar} className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-2 flex-1 rounded-full" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}

export function OwnerWalletSkeleton() {
  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </motion.div>

          {/* Summary Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl shadow-md">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-3 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Payment Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                  <Skeleton className="w-12 h-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-xl" />
                  <Skeleton className="h-9 flex-1 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payout History Table */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="flex gap-4 py-3 border-b border-border/20">
                      {[1, 2, 3, 4, 5].map((cell) => (
                        <Skeleton key={cell} className="h-5 flex-1" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </OwnerLayout>
  );
}
