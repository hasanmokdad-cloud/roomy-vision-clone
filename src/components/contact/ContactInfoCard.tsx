import { Mail, Phone, MapPin } from "lucide-react";

const cardStyle: React.CSSProperties = { backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E5E7EB", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" };

const items = [
  { Icon: Mail, label: "Email", value: "info@tenanters.com", href: "mailto:info@tenanters.com" },
  { Icon: Phone, label: "Phone", value: "Coming Soon", href: null },
  { Icon: MapPin, label: "Location", value: "Beirut, Lebanon", href: null },
];

const ContactInfoCard = () => (
  <div style={cardStyle}>
    <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1D4ED8", marginBottom: "16px" }}>Contact Information</h3>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {items.map(({ Icon, label, value, href }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Icon size={20} style={{ color: "#1D4ED8", flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, color: "#111827", fontSize: "14px", margin: 0 }}>{label}</p>
            {href ? <a href={href} style={{ color: "#6B7280", fontSize: "13px", textDecoration: "none" }}>{value}</a> : <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>{value}</p>}
          </div>
        </div>
      ))}
    </div>
  </div>
);
export default ContactInfoCard;
