import { Video, ExternalLink } from 'lucide-react';

export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams' | null;

/**
 * Extract a clean meeting URL from text that may contain extra formatting
 */
export function extractMeetingUrl(text: string): string | null {
  if (!text) return null;
  
  // Patterns for different meeting platforms
  const patterns = [
    // Google Meet: meet.google.com/xxx-xxxx-xxx
    /https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i,
    // Zoom: zoom.us/j/digits or zoom.us/my/word
    /https?:\/\/[a-z0-9-]*\.?zoom\.us\/(?:j\/\d+|my\/[\w-]+)(?:\?[^\s]*)?/i,
    // Microsoft Teams: teams.microsoft.com/l/meetup-join/...
    /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]*/i,
    // Generic URL fallback
    /https?:\/\/[^\s]+/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}

/**
 * Detect which platform a meeting URL belongs to
 */
export function detectMeetingPlatform(url: string): MeetingPlatform {
  if (!url) return null;
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('meet.google.com')) {
    return 'google_meet';
  } else if (lowerUrl.includes('zoom.us')) {
    return 'zoom';
  } else if (lowerUrl.includes('teams.microsoft.com')) {
    return 'teams';
  }
  
  return null;
}

/**
 * Sanitize meeting link by extracting clean URL and detecting platform
 */
export function sanitizeMeetingLink(text: string): {
  url: string | null;
  platform: MeetingPlatform;
} {
  const url = extractMeetingUrl(text);
  const platform = url ? detectMeetingPlatform(url) : null;
  
  return { url, platform };
}

/**
 * Get the appropriate icon component for a meeting platform
 */
export function getMeetingPlatformIcon(platform: MeetingPlatform) {
  switch (platform) {
    case 'google_meet':
    case 'zoom':
    case 'teams':
      return Video;
    default:
      return ExternalLink;
  }
}

/**
 * Get user-friendly label for meeting platform
 */
export function getMeetingPlatformLabel(platform: MeetingPlatform): string {
  switch (platform) {
    case 'google_meet':
      return 'Join on Google Meet';
    case 'zoom':
      return 'Join on Zoom';
    case 'teams':
      return 'Join on Microsoft Teams';
    default:
      return 'Join Meeting';
  }
}

/**
 * Get platform name for display
 */
export function getMeetingPlatformName(platform: MeetingPlatform): string {
  switch (platform) {
    case 'google_meet':
      return 'Google Meet';
    case 'zoom':
      return 'Zoom';
    case 'teams':
      return 'Microsoft Teams';
    default:
      return 'Meeting';
  }
}

/**
 * Validate if a URL is a valid meeting link
 */
export function isValidMeetingUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
