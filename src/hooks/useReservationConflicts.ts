/**
 * Hook for detecting reservation conflicts
 * Checks for in-progress reservations and provides real-time warnings
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ConflictLevel = 'room' | 'apartment' | 'bedroom' | 'bed';

export interface ConflictInfo {
  hasConflict: boolean;
  conflictType: 'pending_payment' | 'pending' | 'none';
  expiresAt: Date | null;
  timeRemaining: string | null;
  message: string;
  reservationId?: string;
}

interface UseReservationConflictsResult {
  checking: boolean;
  conflict: ConflictInfo | null;
  refresh: () => Promise<void>;
}

const PENDING_STATUSES = ['pending_payment', 'pending'];

function formatTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diffMs = expiresAt.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'expired';
  
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }
  return `${seconds} sec`;
}

function getConflictMessage(level: ConflictLevel, timeRemaining: string | null): string {
  const levelLabel = level === 'bed' ? 'bed' : 
    level === 'bedroom' ? 'bedroom' : 
    level === 'apartment' ? 'apartment' : 'room';
  
  if (timeRemaining === 'expired') {
    return `A previous reservation has expired. This ${levelLabel} may now be available.`;
  }
  
  return `Another user is currently reserving this ${levelLabel}. Their session expires in ${timeRemaining}.`;
}

export function useReservationConflicts(
  level: ConflictLevel,
  entityId: string | undefined
): UseReservationConflictsResult {
  const [checking, setChecking] = useState(false);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  const checkForConflicts = useCallback(async () => {
    if (!entityId) {
      setConflict(null);
      return;
    }

    setChecking(true);
    try {
      // Build query based on level
      let query = supabase
        .from('reservations')
        .select('id, status, expires_at, created_at')
        .in('status', PENDING_STATUSES)
        .order('created_at', { ascending: false })
        .limit(1);

      // Filter by the appropriate ID field
      switch (level) {
        case 'room':
          query = query.eq('room_id', entityId);
          break;
        case 'apartment':
          query = query.eq('apartment_id', entityId);
          break;
        case 'bedroom':
          query = query.eq('bedroom_id', entityId);
          break;
        case 'bed':
          query = query.eq('bed_id', entityId);
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking reservation conflicts:', error);
        setConflict(null);
        return;
      }

      if (!data || data.length === 0) {
        setConflict({
          hasConflict: false,
          conflictType: 'none',
          expiresAt: null,
          timeRemaining: null,
          message: ''
        });
        return;
      }

      const reservation = data[0];
      const expiresAt = reservation.expires_at ? new Date(reservation.expires_at) : null;
      const now = new Date();
      
      // Check if reservation has expired
      if (expiresAt && expiresAt <= now) {
        setConflict({
          hasConflict: false,
          conflictType: 'none',
          expiresAt: null,
          timeRemaining: null,
          message: ''
        });
        return;
      }

      const timeRemaining = expiresAt ? formatTimeRemaining(expiresAt) : null;
      
      setConflict({
        hasConflict: true,
        conflictType: reservation.status as 'pending_payment' | 'pending',
        expiresAt,
        timeRemaining,
        message: getConflictMessage(level, timeRemaining),
        reservationId: reservation.id
      });
    } catch (err) {
      console.error('Error in conflict check:', err);
      setConflict(null);
    } finally {
      setChecking(false);
    }
  }, [entityId, level]);

  // Initial check
  useEffect(() => {
    checkForConflicts();
  }, [checkForConflicts]);

  // Real-time subscription for status changes
  useEffect(() => {
    if (!entityId) return;

    const channel = supabase
      .channel(`reservation-conflicts-${level}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations'
        },
        () => {
          // Refresh on any reservation change
          checkForConflicts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId, level, checkForConflicts]);

  // Countdown timer - update every 10 seconds
  useEffect(() => {
    if (!conflict?.hasConflict || !conflict.expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      if (conflict.expiresAt && conflict.expiresAt <= now) {
        // Expired - refresh to clear conflict
        checkForConflicts();
      } else if (conflict.expiresAt) {
        // Update time remaining
        setConflict(prev => prev ? {
          ...prev,
          timeRemaining: formatTimeRemaining(conflict.expiresAt!),
          message: getConflictMessage(level, formatTimeRemaining(conflict.expiresAt!))
        } : null);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [conflict?.hasConflict, conflict?.expiresAt, level, checkForConflicts]);

  return {
    checking,
    conflict,
    refresh: checkForConflicts
  };
}
