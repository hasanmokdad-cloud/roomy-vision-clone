/**
 * Centralized haptic feedback patterns for consistent UX
 */

const canVibrate = () => typeof navigator !== 'undefined' && 'vibrate' in navigator;

export const haptics = {
  /** Light tap - subtle feedback for selections */
  light: () => {
    if (canVibrate()) navigator.vibrate(10);
  },
  
  /** Medium tap - standard button press feedback */
  medium: () => {
    if (canVibrate()) navigator.vibrate(30);
  },
  
  /** Heavy tap - emphasis actions */
  heavy: () => {
    if (canVibrate()) navigator.vibrate(50);
  },
  
  /** Success pattern - completed actions */
  success: () => {
    if (canVibrate()) navigator.vibrate([30, 50, 30]);
  },
  
  /** Error pattern - failed or cancelled actions */
  error: () => {
    if (canVibrate()) navigator.vibrate([50, 30, 50, 30, 50]);
  },
  
  /** Selection tick - quick feedback for toggles */
  selection: () => {
    if (canVibrate()) navigator.vibrate(15);
  },
  
  /** Long press - held interactions */
  longPress: () => {
    if (canVibrate()) navigator.vibrate(40);
  },
  
  /** Warning - approaching destructive zone */
  warning: () => {
    if (canVibrate()) navigator.vibrate([20, 30, 20]);
  },
  
  /** Swipe threshold reached - ready to navigate */
  swipeReady: () => {
    if (canVibrate()) navigator.vibrate(8);
  },
  
  /** Page navigation complete */
  pageChange: () => {
    if (canVibrate()) navigator.vibrate(12);
  },
  
  /** Pull-to-refresh threshold reached */
  pullReady: () => {
    if (canVibrate()) navigator.vibrate(20);
  },
  
  /** Pull-to-refresh triggered */
  refresh: () => {
    if (canVibrate()) navigator.vibrate([15, 30, 15]);
  },
  
  /** Boundary reached - can't go further */
  boundary: () => {
    if (canVibrate()) navigator.vibrate([8, 20, 8]);
  },
  
  // ===== Voice Recording Haptics (WhatsApp-style) =====
  
  /** Voice recording started - short confirmation */
  voiceStart: () => {
    if (canVibrate()) navigator.vibrate(20);
  },
  
  /** Approaching cancel threshold - warning pulse */
  voiceCancelNear: () => {
    if (canVibrate()) navigator.vibrate([8, 15, 8]);
  },
  
  /** Cancel threshold reached - preparing to cancel */
  voiceCancelReady: () => {
    if (canVibrate()) navigator.vibrate(25);
  },
  
  /** Voice message cancelled - distinctive error pattern */
  voiceCancelled: () => {
    if (canVibrate()) navigator.vibrate([40, 30, 40]);
  },
  
  /** Approaching lock threshold */
  voiceLockNear: () => {
    if (canVibrate()) navigator.vibrate(12);
  },
  
  /** Lock threshold reached - lock engaged */
  voiceLocked: () => {
    if (canVibrate()) navigator.vibrate([15, 40, 15]);
  },
  
  /** Voice message sent - satisfying confirmation */
  voiceSent: () => {
    if (canVibrate()) navigator.vibrate([20, 40, 20]);
  },
};

export type HapticType = keyof typeof haptics;
