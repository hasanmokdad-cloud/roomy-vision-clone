import { Instagram, Linkedin, Facebook } from "lucide-react";

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const cardStyle: React.CSSProperties = { backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };

const socialLinks = [
  { name: "Instagram", Icon: Instagram, href: "https://www.instagram.com/tenanters/", enabled: true },
  { name: "LinkedIn", Icon: Linkedin, href: "#", enabled: false },
  { name: "TikTok", Icon: TikTokIcon, href: "#", enabled: false },
  { name: "Facebook", Icon: Facebook, href: "#", enabled: false },
];

const SocialLinksCard = () => (
  <div style={cardStyle}>
    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1D4ED8", marginBottom: "4px" }}>Follow Us</h3>
    <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "16px" }}>Stay connected on social media</p>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      {socialLinks.map(({ name, Icon, href, enabled }) =>
        enabled ? (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "8px", color: "#1D4ED8", fontSize: "14px", fontWeight: 500, textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            <Icon size={16} />
            {name}
          </a>
        ) : (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9CA3AF", fontSize: "14px", fontWeight: 500 }}>
            <Icon size={16} />
            {name}
          </div>
        )
      )}
    </div>
  </div>
);
export default SocialLinksCard;
