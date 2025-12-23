import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ClipboardList } from 'lucide-react';
import { OwnerLayout } from '@/components/owner/OwnerLayout';
import { OwnerBreadcrumb } from '@/components/owner/OwnerBreadcrumb';
import { OwnerBookingsContent } from '@/components/owner/OwnerBookingsContent';
import { OwnerCalendarContent } from '@/components/owner/OwnerCalendarContent';
import { motion } from 'framer-motion';

const OwnerScheduleHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['bookings', 'calendar'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <OwnerLayout>
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <OwnerBreadcrumb items={[{ label: 'Tour Management' }]} />
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tour Management</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your tour bookings, calendar, and availability
            </p>
          </motion.div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Booking Requests
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar & Availability
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="mt-6">
              <OwnerBookingsContent />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <OwnerCalendarContent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerScheduleHub;
