/**
 * Device Fingerprinting Utility
 * Generates anonymous device fingerprint for security verification
 */

export interface DeviceInfo {
  fingerprintHash: string;
  deviceName: string;
  browserName: string;
  browserVersion: string;
  osName: string;
  osVersion: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  screenResolution: string;
}

// Parse user agent to extract browser info
function getBrowserInfo(): { name: string; version: string } {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox/')) {
    const version = ua.match(/Firefox\/(\d+(\.\d+)?)/)?.[1] || '';
    return { name: 'Firefox', version };
  }
  if (ua.includes('Edg/')) {
    const version = ua.match(/Edg\/(\d+(\.\d+)?)/)?.[1] || '';
    return { name: 'Edge', version };
  }
  if (ua.includes('Chrome/')) {
    const version = ua.match(/Chrome\/(\d+(\.\d+)?)/)?.[1] || '';
    return { name: 'Chrome', version };
  }
  if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const version = ua.match(/Version\/(\d+(\.\d+)?)/)?.[1] || '';
    return { name: 'Safari', version };
  }
  if (ua.includes('Opera') || ua.includes('OPR/')) {
    const version = ua.match(/(?:Opera|OPR)\/(\d+(\.\d+)?)/)?.[1] || '';
    return { name: 'Opera', version };
  }
  
  return { name: 'Unknown', version: '' };
}

// Parse user agent to extract OS info
function getOSInfo(): { name: string; version: string } {
  const ua = navigator.userAgent;
  
  if (ua.includes('Windows NT 10')) return { name: 'Windows', version: '10/11' };
  if (ua.includes('Windows NT 6.3')) return { name: 'Windows', version: '8.1' };
  if (ua.includes('Windows NT 6.2')) return { name: 'Windows', version: '8' };
  if (ua.includes('Windows NT 6.1')) return { name: 'Windows', version: '7' };
  if (ua.includes('Windows')) return { name: 'Windows', version: '' };
  
  if (ua.includes('Mac OS X')) {
    const version = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
    return { name: 'macOS', version };
  }
  
  if (ua.includes('iPhone OS')) {
    const version = ua.match(/iPhone OS (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
    return { name: 'iOS', version };
  }
  
  if (ua.includes('Android')) {
    const version = ua.match(/Android (\d+(\.\d+)?)/)?.[1] || '';
    return { name: 'Android', version };
  }
  
  if (ua.includes('Linux')) return { name: 'Linux', version: '' };
  if (ua.includes('CrOS')) return { name: 'ChromeOS', version: '' };
  
  return { name: 'Unknown', version: '' };
}

// Detect device type
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|opera mobi/i.test(ua)) return 'mobile';
  
  // Check screen size as fallback
  if (window.innerWidth < 768) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  
  return 'desktop';
}

// Generate a hash from string
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Get canvas fingerprint
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Roomy Device FP', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Roomy Device FP', 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return '';
  }
}

// Get WebGL fingerprint
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    
    const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return `${vendor}~${renderer}`;
  } catch {
    return '';
  }
}

/**
 * Generate device fingerprint information
 */
export async function generateDeviceFingerprint(): Promise<DeviceInfo> {
  const browser = getBrowserInfo();
  const os = getOSInfo();
  const deviceType = getDeviceType();
  const screenResolution = `${screen.width}x${screen.height}`;
  
  // Build fingerprint components
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    screenResolution,
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    getCanvasFingerprint(),
    getWebGLFingerprint(),
    navigator.hardwareConcurrency?.toString() || '',
    (navigator as any).deviceMemory?.toString() || '',
  ].filter(Boolean);
  
  // Generate hash
  const fingerprintHash = await hashString(components.join('|||'));
  
  // Generate human-readable device name
  const deviceName = `${browser.name} on ${os.name}`;
  
  return {
    fingerprintHash,
    deviceName,
    browserName: browser.name,
    browserVersion: browser.version,
    osName: os.name,
    osVersion: os.version,
    deviceType,
    screenResolution,
  };
}

/**
 * Get approximate region from timezone (privacy-safe, no IP)
 */
export function getApproximateRegion(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const regionMap: Record<string, string> = {
      'Asia/Beirut': 'Lebanon',
      'Europe/London': 'United Kingdom',
      'America/New_York': 'United States (East)',
      'America/Los_Angeles': 'United States (West)',
      'Europe/Paris': 'France',
      'Europe/Berlin': 'Germany',
      'Asia/Dubai': 'UAE',
      'Asia/Riyadh': 'Saudi Arabia',
      'Africa/Cairo': 'Egypt',
    };
    
    return regionMap[timezone] || timezone.split('/')[0] || 'Unknown';
  } catch {
    return 'Unknown';
  }
}
