import { motion, Variants } from 'framer-motion';

interface DormRoomAnimationProps {
  phase: 1 | 2 | 3;
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

export function DormRoomAnimation({ phase }: DormRoomAnimationProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-80 h-72 lg:w-96 lg:h-80"
    >
      {/* Base isometric container */}
      <div className="absolute inset-0 transform-gpu" style={{ perspective: '1000px' }}>
        
        {/* Phase 3: Exterior wrapper (roof, exterior walls) */}
        {phase === 3 && (
          <>
            {/* Roof */}
            <motion.div
              variants={itemVariants}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-72 lg:w-80"
              style={{ transform: 'translateX(-50%) rotateX(10deg) rotateY(-15deg)' }}
            >
              <div className="relative">
                {/* Main roof */}
                <div className="w-full h-12 bg-slate-700 rounded-t-lg shadow-lg transform -skew-x-6" />
                {/* Skylights */}
                <motion.div variants={itemVariants} className="absolute top-2 left-8 w-6 h-4 bg-sky-300/60 rounded-sm" />
                <motion.div variants={itemVariants} className="absolute top-2 left-20 w-6 h-4 bg-sky-300/60 rounded-sm" />
                {/* Solar panels */}
                <motion.div variants={itemVariants} className="absolute top-1 right-8 w-10 h-6 bg-blue-900 rounded-sm border border-blue-700" />
              </div>
            </motion.div>
            
            {/* Exterior walls/siding */}
            <motion.div
              variants={itemVariants}
              className="absolute top-12 left-1/2 -translate-x-1/2 w-72 lg:w-80 h-48"
            >
              <div className="relative w-full h-full bg-slate-100 rounded-lg shadow-xl transform -skew-x-6 overflow-hidden">
                {/* Windows showing interior */}
                <div className="absolute top-4 left-4 w-16 h-20 bg-amber-100/80 rounded-sm border-2 border-slate-300" />
                <div className="absolute top-4 right-4 w-16 h-20 bg-amber-100/80 rounded-sm border-2 border-slate-300" />
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-24 bg-amber-100/80 rounded-sm border-2 border-slate-300" />
              </div>
            </motion.div>
            
            {/* Landscaping */}
            <motion.div variants={itemVariants} className="absolute bottom-4 left-4 w-8 h-8 bg-green-600 rounded-full shadow-md" />
            <motion.div variants={itemVariants} className="absolute bottom-4 left-14 w-6 h-6 bg-green-500 rounded-full shadow-md" />
            <motion.div variants={itemVariants} className="absolute bottom-4 right-8 w-10 h-10 bg-green-700 rounded-full shadow-md" />
            
            {/* Trees */}
            <motion.div variants={itemVariants} className="absolute bottom-8 right-2">
              <div className="w-4 h-8 bg-amber-800 rounded-sm" />
              <div className="w-12 h-12 bg-green-600 rounded-full -mt-8 -ml-4" />
            </motion.div>
            
            {/* Outdoor bench */}
            <motion.div variants={itemVariants} className="absolute bottom-6 left-1/2 -translate-x-1/2">
              <div className="w-12 h-3 bg-amber-700 rounded-sm" />
              <div className="flex justify-between">
                <div className="w-1 h-2 bg-amber-800" />
                <div className="w-1 h-2 bg-amber-800" />
              </div>
            </motion.div>
          </>
        )}

        {/* Phases 1 & 2: Interior room */}
        {phase <= 2 && (
          <>
            {/* Floor */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 w-64 lg:w-72 h-32"
            >
              <div className="w-full h-full bg-amber-200 rounded-lg shadow-inner transform -skew-x-6 skew-y-3" />
            </motion.div>

            {/* Back wall */}
            <motion.div
              variants={itemVariants}
              className="absolute top-8 left-1/2 -translate-x-1/2 w-64 lg:w-72 h-48"
            >
              <div className="w-full h-full bg-slate-100 rounded-t-lg shadow-lg transform -skew-x-6" />
            </motion.div>

            {/* Side wall */}
            <motion.div
              variants={itemVariants}
              className="absolute top-8 right-8 lg:right-4 w-24 h-48"
            >
              <div className="w-full h-full bg-slate-200 rounded-tr-lg shadow-lg transform skew-y-12" />
            </motion.div>

            {/* Loft/second floor */}
            <motion.div
              variants={itemVariants}
              className="absolute top-20 left-12 lg:left-16 w-32 h-4"
            >
              <div className="w-full h-full bg-amber-700 rounded shadow-md transform -skew-x-6" />
            </motion.div>

            {/* Staircase */}
            <motion.div
              variants={itemVariants}
              className="absolute top-24 left-40 lg:left-44"
            >
              <div className="space-y-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-6 h-2 bg-amber-600 rounded-sm transform -skew-x-6" style={{ marginLeft: i * 4 }} />
                ))}
              </div>
            </motion.div>

            {/* Bed on loft */}
            <motion.div
              variants={itemVariants}
              className="absolute top-14 left-14 lg:left-18"
            >
              <div className="w-20 h-10 bg-slate-300 rounded-lg shadow-md transform -skew-x-6" />
              <div className="absolute top-1 left-1 w-6 h-4 bg-white rounded-sm" /> {/* Pillow */}
            </motion.div>

            {/* Dresser */}
            <motion.div
              variants={itemVariants}
              className="absolute top-28 left-8 lg:left-12"
            >
              <div className="w-12 h-16 bg-amber-500 rounded-sm shadow-md transform -skew-x-6">
                <div className="mt-2 mx-1 w-10 h-3 bg-amber-600 rounded-sm" />
                <div className="mt-1 mx-1 w-10 h-3 bg-amber-600 rounded-sm" />
                <div className="mt-1 mx-1 w-10 h-3 bg-amber-600 rounded-sm" />
              </div>
            </motion.div>

            {/* Sofa */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-24 left-1/2 -translate-x-1/2"
            >
              <div className="relative">
                <div className="w-28 h-10 bg-teal-600 rounded-lg shadow-md transform -skew-x-6" />
                <div className="absolute -top-3 left-0 w-6 h-10 bg-teal-700 rounded-l-lg transform -skew-x-6" />
                <div className="absolute -top-3 right-0 w-6 h-10 bg-teal-700 rounded-r-lg transform -skew-x-6" />
              </div>
            </motion.div>

            {/* Coffee table */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-20 left-1/2 translate-x-2"
            >
              <div className="w-14 h-6 bg-amber-400 rounded-sm shadow-md transform -skew-x-6" />
            </motion.div>

            {/* Dining table + chairs */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-28 right-16 lg:right-20"
            >
              <div className="w-16 h-8 bg-amber-300 rounded-sm shadow-md transform -skew-x-6" />
              {/* Chairs */}
              <div className="absolute -left-3 top-1 w-4 h-6 bg-amber-500 rounded-t-sm transform -skew-x-6" />
              <div className="absolute -right-3 top-1 w-4 h-6 bg-amber-500 rounded-t-sm transform -skew-x-6" />
            </motion.div>

            {/* Rug */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-18 left-1/2 -translate-x-8"
            >
              <div className="w-24 h-12 bg-rose-300/60 rounded-full transform -skew-x-6" />
            </motion.div>
          </>
        )}

        {/* Phase 2: Decorations (added on top of phase 1) */}
        {phase >= 2 && phase < 3 && (
          <>
            {/* Orange blanket on bed */}
            <motion.div
              variants={itemVariants}
              className="absolute top-16 left-20 lg:left-24"
            >
              <div className="w-14 h-6 bg-orange-400 rounded-sm shadow-sm transform -skew-x-6" />
            </motion.div>

            {/* Basket near bed */}
            <motion.div
              variants={itemVariants}
              className="absolute top-24 left-32 lg:left-36"
            >
              <div className="w-5 h-5 bg-amber-600 rounded-full shadow-sm" />
            </motion.div>

            {/* Desk */}
            <motion.div
              variants={itemVariants}
              className="absolute top-36 right-24 lg:right-28"
            >
              <div className="w-16 h-4 bg-slate-400 rounded-sm shadow-md transform -skew-x-6" />
              {/* Computer monitor */}
              <div className="absolute -top-6 left-2 w-8 h-6 bg-slate-700 rounded-sm" />
              <div className="absolute -top-7 left-3 w-6 h-4 bg-blue-400/80 rounded-sm" />
            </motion.div>

            {/* Desk chair */}
            <motion.div
              variants={itemVariants}
              className="absolute top-40 right-20 lg:right-24"
            >
              <div className="w-6 h-6 bg-slate-600 rounded-lg shadow-sm transform -skew-x-6" />
            </motion.div>

            {/* Wall art */}
            <motion.div
              variants={itemVariants}
              className="absolute top-16 left-1/2 -translate-x-4"
            >
              <div className="w-8 h-6 bg-rose-400 rounded-sm shadow-sm" />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="absolute top-14 left-1/2 translate-x-6"
            >
              <div className="w-6 h-8 bg-blue-400 rounded-sm shadow-sm" />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="absolute top-18 right-32 lg:right-36"
            >
              <div className="w-10 h-6 bg-amber-400 rounded-sm shadow-sm" />
            </motion.div>

            {/* TV on wall */}
            <motion.div
              variants={itemVariants}
              className="absolute top-28 left-1/2 -translate-x-8"
            >
              <div className="w-16 h-10 bg-slate-800 rounded-sm shadow-md" />
              <div className="absolute inset-1 bg-slate-600 rounded-sm" />
            </motion.div>

            {/* Plants */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-32 left-6 lg:left-10"
            >
              <div className="w-4 h-4 bg-amber-600 rounded-sm" />
              <div className="absolute -top-6 left-0 w-6 h-8 bg-green-500 rounded-full" />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="absolute bottom-36 right-8 lg:right-12"
            >
              <div className="w-3 h-3 bg-slate-500 rounded-sm" />
              <div className="absolute -top-4 -left-1 w-5 h-6 bg-green-600 rounded-full" />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="absolute top-32 left-4 lg:left-8"
            >
              <div className="w-3 h-10 bg-amber-700 rounded-sm" />
              <div className="absolute -top-4 -left-2 w-7 h-8 bg-green-500 rounded-full" />
            </motion.div>

            {/* Mirror */}
            <motion.div
              variants={itemVariants}
              className="absolute top-20 right-12 lg:right-16"
            >
              <div className="w-6 h-10 bg-sky-200 rounded-full shadow-sm border-2 border-amber-400" />
            </motion.div>

            {/* Books on coffee table */}
            <motion.div
              variants={itemVariants}
              className="absolute bottom-22 left-1/2 translate-x-4"
            >
              <div className="flex gap-0.5">
                <div className="w-2 h-3 bg-red-500 rounded-sm" />
                <div className="w-2 h-3 bg-blue-500 rounded-sm" />
                <div className="w-2 h-3 bg-green-500 rounded-sm" />
              </div>
            </motion.div>

            {/* Curtains */}
            <motion.div
              variants={itemVariants}
              className="absolute top-10 left-8 lg:left-12"
            >
              <div className="w-4 h-24 bg-rose-200/70 rounded-sm" />
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="absolute top-10 left-28 lg:left-32"
            >
              <div className="w-4 h-24 bg-rose-200/70 rounded-sm" />
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
