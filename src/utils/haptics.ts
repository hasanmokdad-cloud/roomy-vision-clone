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
};

export type HapticType = keyof typeof haptics;
