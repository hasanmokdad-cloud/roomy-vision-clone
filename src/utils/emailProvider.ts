export interface EmailProviderInfo {
  provider: string;
  label: string;
  url: string;
  domain: string;
}

// Known provider mappings
const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];
const GOOGLE_WORKSPACE_DOMAINS = ['aiesec.net', 'aiesec.org'];
const OUTLOOK_PERSONAL_DOMAINS = ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'];
const OFFICE365_DOMAINS = ['lau.edu', 'lau.edu.lb', 'aub.edu.lb', 'mail.aub.edu', 'aub.edu'];
const YAHOO_DOMAINS = ['yahoo.com', 'yahoo.fr', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com'];
const ICLOUD_DOMAINS = ['icloud.com', 'me.com', 'mac.com'];
const PROTON_DOMAINS = ['proton.me', 'protonmail.com'];
const ZOHO_DOMAINS = ['zoho.com', 'zohomail.com'];
const YANDEX_DOMAINS = ['yandex.com', 'yandex.ru'];
const AOL_DOMAINS = ['aol.com'];
const GMX_DOMAINS = ['gmx.com', 'gmx.net'];
const FASTMAIL_DOMAINS = ['fastmail.com'];
const TUTANOTA_DOMAINS = ['tutanota.com', 'tutanota.de'];

export function getEmailProviderInfo(email: string | null | undefined): EmailProviderInfo | null {
  if (!email || !email.includes('@')) return null;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;

  // Gmail
  if (GMAIL_DOMAINS.includes(domain)) {
    return { provider: 'gmail', label: 'Open Gmail', url: 'https://mail.google.com/', domain };
  }

  // Google Workspace (special override for known domains)
  if (GOOGLE_WORKSPACE_DOMAINS.includes(domain)) {
    return { provider: 'gmail', label: 'Open Gmail', url: 'https://mail.google.com/', domain };
  }

  // Outlook personal (outlook.com, hotmail.com, live.com, msn.com)
  if (OUTLOOK_PERSONAL_DOMAINS.includes(domain)) {
    return { provider: 'outlook', label: 'Open Outlook', url: 'https://outlook.live.com/mail/', domain };
  }

  // Office 365 / Microsoft-hosted university mail
  if (OFFICE365_DOMAINS.includes(domain)) {
    return { provider: 'office365', label: 'Open Outlook', url: 'https://outlook.office.com/mail/', domain };
  }

  // Yahoo
  if (YAHOO_DOMAINS.includes(domain)) {
    return { provider: 'yahoo', label: 'Open Yahoo Mail', url: 'https://mail.yahoo.com/', domain };
  }

  // iCloud
  if (ICLOUD_DOMAINS.includes(domain)) {
    return { provider: 'icloud', label: 'Open iCloud Mail', url: 'https://www.icloud.com/mail', domain };
  }

  // ProtonMail
  if (PROTON_DOMAINS.includes(domain)) {
    return { provider: 'proton', label: 'Open ProtonMail', url: 'https://mail.proton.me/', domain };
  }

  // Zoho
  if (ZOHO_DOMAINS.includes(domain)) {
    return { provider: 'zoho', label: 'Open Zoho Mail', url: 'https://mail.zoho.com/', domain };
  }

  // Yandex
  if (YANDEX_DOMAINS.includes(domain)) {
    return { provider: 'yandex', label: 'Open Yandex Mail', url: 'https://mail.yandex.com/', domain };
  }

  // AOL
  if (AOL_DOMAINS.includes(domain)) {
    return { provider: 'aol', label: 'Open AOL Mail', url: 'https://mail.aol.com/', domain };
  }

  // GMX
  if (GMX_DOMAINS.includes(domain)) {
    return { provider: 'gmx', label: 'Open GMX Mail', url: 'https://www.gmx.com/', domain };
  }

  // Fastmail
  if (FASTMAIL_DOMAINS.includes(domain)) {
    return { provider: 'fastmail', label: 'Open Fastmail', url: 'https://www.fastmail.com/login/', domain };
  }

  // Tutanota
  if (TUTANOTA_DOMAINS.includes(domain)) {
    return { provider: 'tutanota', label: 'Open Tutanota', url: 'https://mail.tutanota.com/', domain };
  }

  // .edu or .edu.lb domains → Office 365 (Microsoft-hosted)
  if (domain.endsWith('.edu') || domain.endsWith('.edu.lb')) {
    return { provider: 'office365', label: 'Open Outlook', url: 'https://outlook.office.com/mail/', domain };
  }

  // .gov or .gov.lb domains → Office 365 (Microsoft-hosted)
  if (domain.endsWith('.gov') || domain.endsWith('.gov.lb')) {
    return { provider: 'office365', label: 'Open Outlook', url: 'https://outlook.office.com/mail/', domain };
  }

  // Custom domain fallback - always domain-specific, never "generic"
  return { 
    provider: 'custom-domain', 
    label: `Open ${domain} mail`, 
    url: `https://mail.${domain}`, 
    domain 
  };
}
