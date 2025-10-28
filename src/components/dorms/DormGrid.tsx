import { motion } from 'framer-motion';
import { DormCard } from './DormCard';
import { SeedDorm } from '@/data/dorms.seed';

interface DormGridProps {
  dorms: SeedDorm[];
  capacityFilter?: number;
}

export const DormGrid: React.FC<DormGridProps> = ({ dorms, capacityFilter }) => {
  // Filter dorms that have at least one matching room
  const visibleDorms = dorms.filter((dorm) => {
    if (!capacityFilter) return true;
    return dorm.rooms.some((room) => room.capacity >= capacityFilter);
  });

  if (visibleDorms.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16 glass-hover rounded-3xl p-12"
      >
        <h3 className="text-2xl font-black gradient-text mb-4">No Matches Found</h3>
        <p className="text-foreground/70">
          Try adjusting your filters to see more results
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {visibleDorms.map((dorm, index) => (
        <motion.div
          key={dorm.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <DormCard dorm={dorm} capacityFilter={capacityFilter} />
        </motion.div>
      ))}
    </div>
  );
};
