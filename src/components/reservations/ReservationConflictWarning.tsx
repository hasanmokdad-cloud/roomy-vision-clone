/**
 * Warning banner for reservation conflicts
 * Shows when another user is in the process of reserving
 */

import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ConflictInfo } from '@/hooks/useReservationConflicts';

interface ReservationConflictWarningProps {
  conflict: ConflictInfo;
  onRefresh?: () => void;
  className?: string;
}

export function ReservationConflictWarning({
  conflict,
  onRefresh,
  className = ''
}: ReservationConflictWarningProps) {
  if (!conflict.hasConflict) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border border-yellow-300 bg-yellow-50 p-3 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800">
            Reservation in Progress
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            {conflict.message}
          </p>
          
          {conflict.timeRemaining && conflict.timeRemaining !== 'expired' && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-600">
              <Clock className="h-3.5 w-3.5" />
              <span>Expires in: <strong>{conflict.timeRemaining}</strong></span>
            </div>
          )}
        </div>

        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="flex-shrink-0 h-8 w-8 p-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
