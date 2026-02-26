"use client";

import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import { useTheme } from "@/context/ThemeContext";

export default function PrivacyPolicyPage() {
  const { colors } = useTheme();

  const sectionStyle = {
    marginBottom: "40px",
  };

  const h2Style = {
    fontSize: "clamp(16px, 2.5vw, 20px)",
    fontWeight: "500" as const,
    color: colors.text,
    marginBottom: "14px",
    marginTop: "0",
    letterSpacing: "-0.3px",
  };

  const pStyle = {
    color: colors.textSecondary,
    fontSize: "clamp(14px, 2vw, 15px)",
    lineHeight: "1.85",
    margin: "0 0 12px",
  };

  const liStyle = {
    color: colors.textSecondary,
    fontSize: "clamp(14px, 2vw, 15px)",
    lineHeight: "1.85",
    marginBottom: "8px",
  };

  const dividerStyle = {
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: "40px",
  };

  const tagStyle = {
    display: "inline-block",
    padding: "4px 10px",
    background: colors.backgroundSecondary,
    border: `1px solid ${colors.border}`,
    borderRadius: "6px",
    fontSize: "12px",
    color: colors.textSecondary,
    marginRight: "8px",
    marginBottom: "8px",
  };

  return (
    <>
      <PublicNavbar />
      <main style={{
        minHeight: "100vh",
        background: colors.background,
        transition: "all 0.3s ease",
        paddingTop: "80px",
      }}>
        {/* Page Header */}
        <section style={{
          padding: "clamp(48px, 8vw, 80px) 20px clamp(32px, 5vw, 56px)",
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <p style={{
              fontSize: "11px",
              fontWeight: "500",
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "20px",
            }}>
              Legal
            </p>
            <h1 style={{
              fontSize: "clamp(32px, 6vw, 56px)",
              fontWeight: "300",
              color: colors.text,
              letterSpacing: "-1.5px",
              margin: "0 0 20px",
              lineHeight: "1.1",
            }}>
              Privacy Policy
            </h1>
            <p style={{
              color: colors.textSecondary,
              fontSize: "clamp(13px, 1.8vw, 14px)",
            }}>
              Last updated: 26 February 2026
            </p>
          </div>
        </section>

        {/* Body */}
        <section style={{
          padding: "clamp(40px, 6vw, 72px) 20px clamp(60px, 10vw, 120px)",
          maxWidth: "760px",
          margin: "0 auto",
        }}>

          {/* Intro */}
          <div style={{ marginBottom: "48px" }}>
            <p style={pStyle}>
              This Privacy Policy explains how Apollova ("we", "us", "our") collects, uses,
              and protects information when you use our website and platform at{" "}
              <strong style={{ color: colors.text }}>apollova.co.uk</strong>. We are committed
              to being transparent about the data we handle and how it is used solely to provide
              the Service.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 1 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>1. Information We Collect</h2>
            <p style={pStyle}>
              We collect only the information necessary to operate the platform. This includes:
            </p>

            <p style={{ ...pStyle, fontWeight: "500", color: colors.text, marginTop: "20px" }}>
              a) Licence & Account Data
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              <li style={liStyle}>Licence key identifiers and activation records</li>
              <li style={liStyle}>Device identifiers associated with licence activations</li>
              <li style={liStyle}>Activation timestamps and reset history</li>
            </ul>

            <p style={{ ...pStyle, fontWeight: "500", color: colors.text, marginTop: "20px" }}>
              b) OAuth Tokens (Social Account Connections)
            </p>
            <p style={pStyle}>
              When you connect a TikTok or YouTube account, we store the OAuth access and
              refresh tokens provided by those platforms. These tokens are used exclusively to
              authenticate and publish content on your behalf. We do not store your social media
              passwords.
            </p>

            <p style={{ ...pStyle, fontWeight: "500", color: colors.text, marginTop: "20px" }}>
              c) Uploaded Video Files
            </p>
            <p style={pStyle}>
              Video files you upload are stored temporarily to facilitate scheduling and
              automated publishing to your connected accounts. Files are not permanently retained
              beyond what is required to complete the scheduled upload.
            </p>

            <p style={{ ...pStyle, fontWeight: "500", color: colors.text, marginTop: "20px" }}>
              d) Video Metadata
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "16px" }}>
              <li style={liStyle}>Titles, descriptions, and captions you provide</li>
              <li style={liStyle}>Scheduled publication dates and times</li>
              <li style={liStyle}>Publishing status (draft, scheduled, published)</li>
            </ul>

            <p style={{ ...pStyle, fontWeight: "500", color: colors.text, marginTop: "20px" }}>
              e) Analytics Data
            </p>
            <p style={pStyle}>
              We use Google Analytics to collect aggregated, anonymised data about how visitors
              interact with our public website pages (e.g. page views, session duration, device
              type). This data does not identify you personally. You can opt out of Google
              Analytics tracking via your browser settings or the{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: colors.accent, textDecoration: "none", borderBottom: `1px solid ${colors.accent}`, paddingBottom: "1px" }}
              >
                Google Analytics Opt-out Browser Add-on
              </a>.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 2 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>2. Information We Do Not Collect</h2>
            <p style={pStyle}>We do not collect or store:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Your name, email address, or physical address</li>
              <li style={liStyle}>Payment information (handled externally, not through our platform)</li>
              <li style={liStyle}>Social media passwords or login credentials</li>
              <li style={liStyle}>IP addresses for tracking or profiling</li>
              <li style={liStyle}>Cookies beyond those set by Google Analytics</li>
            </ul>
          </div>

          <div style={dividerStyle} />

          {/* Section 3 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>3. How We Use Your Information</h2>
            <p style={pStyle}>We use the information collected solely to:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Verify your licence and grant access to the platform</li>
              <li style={liStyle}>Authenticate your connected social accounts via OAuth</li>
              <li style={liStyle}>Store and schedule your video content for automated publishing</li>
              <li style={liStyle}>Post content to TikTok on your behalf at scheduled times</li>
              <li style={liStyle}>Understand aggregate website usage to improve the Service</li>
            </ul>
            <p style={pStyle}>
              We do not use your data for advertising, profiling, or any purpose beyond
              delivering the core Service.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 4 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>4. Third-Party Services</h2>
            <p style={pStyle}>
              The following third-party services are used as part of the platform:
            </p>

            <div style={{ marginTop: "16px" }}>
              {/* TikTok */}
              <div style={{
                padding: "20px",
                background: colors.backgroundSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                marginBottom: "12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ ...tagStyle, marginRight: "0", marginBottom: "0" }}>TikTok API</span>
                </div>
                <p style={{ ...pStyle, margin: "0" }}>
                  Used to publish scheduled videos to your TikTok account. Subject to the{" "}
                  <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
                    style={{ color: colors.accent, textDecoration: "none" }}>
                    TikTok Privacy Policy
                  </a>.
                </p>
              </div>

              {/* YouTube */}
              <div style={{
                padding: "20px",
                background: colors.backgroundSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                marginBottom: "12px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ ...tagStyle, marginRight: "0", marginBottom: "0" }}>YouTube OAuth</span>
                </div>
                <p style={{ ...pStyle, margin: "0" }}>
                  Used for authenticated access to YouTube as part of the Apollova installer's
                  audio download pipeline. Subject to{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                    style={{ color: colors.accent, textDecoration: "none" }}>
                    Google's Privacy Policy
                  </a>.
                </p>
              </div>

              {/* Google Analytics */}
              <div style={{
                padding: "20px",
                background: colors.backgroundSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ ...tagStyle, marginRight: "0", marginBottom: "0" }}>Google Analytics</span>
                </div>
                <p style={{ ...pStyle, margin: "0" }}>
                  Used to collect anonymised website usage statistics on our public marketing pages.
                  Data is aggregated and does not identify individual visitors. Subject to{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                    style={{ color: colors.accent, textDecoration: "none" }}>
                    Google's Privacy Policy
                  </a>.
                </p>
              </div>
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Section 5 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>5. Data Retention</h2>
            <p style={pStyle}>
              We retain data only for as long as is necessary to provide the Service:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>
                <strong style={{ color: colors.text }}>Uploaded videos</strong> — stored temporarily
                and removed after successful publication or upon user deletion
              </li>
              <li style={liStyle}>
                <strong style={{ color: colors.text }}>OAuth tokens</strong> — retained while your
                account connection is active; removed when you disconnect the integration
              </li>
              <li style={liStyle}>
                <strong style={{ color: colors.text }}>Licence records</strong> — retained for the
                duration of your licence for verification and support purposes
              </li>
              <li style={liStyle}>
                <strong style={{ color: colors.text }}>Video metadata</strong> — retained until you
                delete a video or terminate access to the platform
              </li>
            </ul>
          </div>

          <div style={dividerStyle} />

          {/* Section 6 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>6. Data Security</h2>
            <p style={pStyle}>
              We implement appropriate technical measures to protect the data we hold, including
              encrypted storage of OAuth tokens and authenticated access controls for the platform.
              No method of transmission over the internet is completely secure, and we cannot
              guarantee absolute security. We encourage you to use strong credentials and to
              disconnect unused integrations promptly.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 7 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>7. Children's Privacy</h2>
            <p style={pStyle}>
              The Apollova platform is not intended for use by individuals under the age of 13.
              We do not knowingly collect any information from children. If you believe a minor
              has provided data through our Service, please contact us and we will take steps
              to remove that information.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 8 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>8. Your Rights</h2>
            <p style={pStyle}>
              Depending on your location, you may have rights regarding your personal data,
              including the right to request access, correction, or deletion. To exercise any
              of these rights, or to request the removal of your connected account tokens or
              uploaded content, please contact us directly. We will respond to all reasonable
              requests within a reasonable timeframe.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 9 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>9. Changes to This Policy</h2>
            <p style={pStyle}>
              We may update this Privacy Policy from time to time. Updates will be reflected
              by the date at the top of this page. We encourage you to review this page
              periodically. Your continued use of the Service after any changes constitutes
              acceptance of the updated Policy.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 10 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>10. Contact</h2>
            <p style={pStyle}>
              For any questions, concerns, or data-related requests regarding this Privacy
              Policy, please contact us at:
            </p>
            <a
              href="mailto:contact@apollova.co.uk"
              style={{
                color: colors.accent,
                textDecoration: "none",
                fontSize: "clamp(14px, 2vw, 15px)",
                borderBottom: `1px solid ${colors.accent}`,
                paddingBottom: "2px",
              }}
            >
              contact@apollova.co.uk
            </a>
          </div>

        </section>
      </main>
      <PublicFooter />
    </>
  );
}
