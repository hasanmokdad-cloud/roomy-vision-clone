import { Link } from "react-router-dom";
import { MapPin, Mail, Phone, Instagram, Linkedin, Music2, Facebook } from "lucide-react";

const Footer = () => {
  const quickLinks = [
    { to: "/listings", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/faq", label: "FAQ" },
    { to: "/help", label: "Help Center" },
  ];
  const legalLinks = [
    { to: "/legal/terms", label: "Terms of Service" },
    { to: "/legal/privacy", label: "Privacy Policy" },
    { to: "/legal/payments", label: "Payments Disclaimer" },
    { to: "/legal/community", label: "Community Guidelines" },
    { to: "/legal/data-rights", label: "Data Rights" },
  ];
  const contactItems = [
    { icon: Mail, label: "info@tenanters.com" },
    { icon: Phone, label: "Coming Soon" },
    { icon: MapPin, label: "Beirut, Lebanon" },
  ];
  const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/tenanters/" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "TikTok", icon: Music2, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" },
  ];

  const headerStyle: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.10em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.50)",
    marginBottom: "20px",
  };

  const linkStyle: React.CSSProperties = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "15px",
    fontWeight: 400,
    color: "rgba(255,255,255,0.70)",
  };

  return (
    <footer style={{ backgroundColor: "#1E3A5F", width: "100%" }}>
      {/* Mobile Footer */}
      <div className="block md:hidden" style={{ padding: "40px 20px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "22px", fontWeight: 800, color: "#FFFFFF" }}>
            Tenanters
          </span>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.55)", marginTop: "8px" }}>
            Your home away from home.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
          <div>
            <p style={headerStyle}>QUICK LINKS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to} style={linkStyle} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p style={headerStyle}>FOLLOW US</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="flex items-center justify-center transition-all duration-200"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(37,99,235,0.35)";
                    e.currentTarget.style.borderColor = "rgba(37,99,235,0.50)";
                    (e.currentTarget.querySelector("svg") as SVGElement).style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    (e.currentTarget.querySelector("svg") as SVGElement).style.color = "rgba(255,255,255,0.60)";
                  }}
                >
                  <social.icon size={16} style={{ color: "rgba(255,255,255,0.60)" }} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p style={headerStyle}>LEGAL</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {legalLinks.map((link) => (
                <Link key={link.to} to={link.to} style={linkStyle} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p style={headerStyle}>CONTACT</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {contactItems.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", ...linkStyle, fontSize: "13px" }}>
                  <item.icon size={14} style={{ color: "rgba(255,255,255,0.45)", flexShrink: 0 }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", marginTop: "32px", paddingTop: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
            © 2026 Tenanters. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px" }}>
            <Link to="/legal/privacy" style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >Privacy Policy</Link>
            <span style={{ color: "rgba(255,255,255,0.20)" }}>·</span>
            <Link to="/legal/terms" style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >Terms of Service</Link>
          </div>
        </div>
      </div>

      {/* Desktop Footer */}
      <div className="hidden md:block" style={{ maxWidth: "1200px", margin: "0 auto", padding: "56px 40px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
          <div>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "24px", fontWeight: 800, color: "#FFFFFF", display: "block", marginBottom: "10px" }}>
              Tenanters
            </span>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: "1.6", marginBottom: "24px" }}>
              Your home away from home.
            </p>

            <div>
              <p style={headerStyle}>FOLLOW US</p>
              <div style={{ display: "flex", gap: "10px" }}>
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(37,99,235,0.35)";
                      e.currentTarget.style.borderColor = "rgba(37,99,235,0.50)";
                      (e.currentTarget.querySelector("svg") as SVGElement).style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                      (e.currentTarget.querySelector("svg") as SVGElement).style.color = "rgba(255,255,255,0.60)";
                    }}
                  >
                    <social.icon size={16} style={{ color: "rgba(255,255,255,0.60)" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p style={headerStyle}>QUICK LINKS</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {quickLinks.map((link) => (
                <Link key={link.to} to={link.to} style={linkStyle} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p style={headerStyle}>LEGAL</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {legalLinks.map((link) => (
                <Link key={link.to} to={link.to} style={linkStyle} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p style={headerStyle}>CONTACT</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {contactItems.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", ...linkStyle, fontSize: "14px" }}>
                  <item.icon size={15} style={{ color: "rgba(255,255,255,0.45)", flexShrink: 0 }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>
            © 2026 Tenanters. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", fontSize: "13px" }}>
            <Link to="/legal/privacy" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >Privacy Policy</Link>
            <span style={{ color: "rgba(255,255,255,0.20)" }}>·</span>
            <Link to="/legal/terms" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.60)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
            >Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
