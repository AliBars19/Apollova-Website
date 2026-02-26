"use client";

import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import { useTheme } from "@/context/ThemeContext";

export default function TermsPage() {
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
              Terms of Service
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
              These Terms of Service ("Terms") govern your access to and use of the
              Apollova website and platform, accessible at{" "}
              <strong style={{ color: colors.text }}>apollova.co.uk</strong> ("the Service"),
              operated by Apollova. By accessing or using the Service, you agree to be bound
              by these Terms. If you do not agree, you may not use the Service.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 1 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>1. Description of the Service</h2>
            <p style={pStyle}>
              Apollova is a professional platform for creating and scheduling AI-powered lyric
              videos. The Service allows licensed users to upload rendered video files, connect
              social media accounts (TikTok, YouTube), and schedule content for automated
              publishing. The website also showcases our three After Effects video templates —
              Aurora, Mono, and Onyx.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 2 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>2. Eligibility & Licence Keys</h2>
            <p style={pStyle}>
              Access to the Apollova platform requires a valid licence key. Licence keys are
              issued by Apollova and are personal, non-transferable, and non-refundable unless
              otherwise agreed in writing. You agree to:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Keep your licence key confidential and secure</li>
              <li style={liStyle}>Not share, sell, or distribute your licence key to any third party</li>
              <li style={liStyle}>Notify us immediately if you believe your key has been compromised</li>
              <li style={liStyle}>Use a maximum of one active device per licence key unless explicitly permitted</li>
            </ul>
            <p style={pStyle}>
              We reserve the right to revoke a licence key at any time if these Terms are
              violated, without obligation to issue a refund.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 3 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>3. User Content & Uploads</h2>
            <p style={pStyle}>
              You retain full ownership of any content you upload to the Service, including
              video files. By uploading content, you grant Apollova a limited, non-exclusive,
              royalty-free licence to store, process, and publish that content on your behalf
              in accordance with your scheduling instructions.
            </p>
            <p style={pStyle}>
              You represent and warrant that:
            </p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>
                You own or hold sufficient rights to all content you upload, including music,
                imagery, and lyrics
              </li>
              <li style={liStyle}>
                Your content does not infringe any third-party intellectual property rights,
                including copyright and neighbouring rights
              </li>
              <li style={liStyle}>
                Your content complies with TikTok's Community Guidelines and any other
                platform rules applicable to your chosen publishing destinations
              </li>
              <li style={liStyle}>
                Your content does not contain unlawful, harmful, defamatory, or malicious material
              </li>
            </ul>
            <p style={pStyle}>
              Uploaded videos are stored temporarily for the purpose of scheduling and
              publishing. Files may be retained for a reasonable period to ensure successful
              delivery and are not repurposed or shared with any party beyond the scheduled
              publishing destination.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 4 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>4. Third-Party Integrations</h2>
            <p style={pStyle}>
              The Service integrates with third-party platforms including TikTok and YouTube to
              enable OAuth-based authentication and automated content posting. By connecting
              these accounts, you authorise Apollova to act on your behalf to publish content
              according to your scheduling configuration.
            </p>
            <p style={pStyle}>
              Your use of these integrations is additionally governed by the terms and privacy
              policies of the respective platforms. Apollova is not responsible for any changes
              to third-party APIs, account suspensions, or restrictions imposed by those platforms.
            </p>
            <p style={pStyle}>
              You may disconnect any third-party integration at any time from within the platform.
              Revoking access on the third-party platform directly will also terminate the integration.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 5 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>5. Acceptable Use</h2>
            <p style={pStyle}>You agree not to:</p>
            <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={liStyle}>Upload content that infringes copyright or other intellectual property rights</li>
              <li style={liStyle}>Submit malicious files, scripts, or disruptive code to the Service</li>
              <li style={liStyle}>Attempt to reverse-engineer, decompile, or tamper with the platform</li>
              <li style={liStyle}>Circumvent licence verification, authentication, or security measures</li>
              <li style={liStyle}>Use the Service to spam, deceive, or mislead any person or platform</li>
              <li style={liStyle}>
                Use automated tools to access the Service in a manner that places excessive load
                on our infrastructure
              </li>
            </ul>
          </div>

          <div style={dividerStyle} />

          {/* Section 6 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>6. Scheduling & Publishing</h2>
            <p style={pStyle}>
              The platform schedules content for automated posting within configurable parameters
              (e.g. up to 12 videos per day). Apollova does not guarantee specific posting times,
              reach, engagement, or platform approval of scheduled content. Publishing is
              contingent on the availability of connected third-party APIs and your account
              remaining in good standing on those platforms.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 7 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>7. Intellectual Property</h2>
            <p style={pStyle}>
              All Apollova branding, templates (Aurora, Mono, Onyx), software, design, and
              website content are the intellectual property of Apollova and are protected by
              copyright and other applicable laws. You may not reproduce, distribute, or
              create derivative works from our materials without prior written consent.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 8 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>8. Disclaimer of Warranties</h2>
            <p style={pStyle}>
              The Service is provided "as is" and "as available" without warranties of any kind,
              express or implied, including but not limited to warranties of merchantability,
              fitness for a particular purpose, or non-infringement. We do not warrant that the
              Service will be uninterrupted, error-free, or free from viruses or other harmful components.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 9 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>9. Limitation of Liability</h2>
            <p style={pStyle}>
              To the fullest extent permitted by applicable law, Apollova shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages, including loss
              of data, revenue, goodwill, or content, arising from your use of or inability to use
              the Service — even if we have been advised of the possibility of such damages.
            </p>
            <p style={pStyle}>
              Our total liability to you for any claim arising from these Terms or your use of the
              Service shall not exceed the amount paid by you for the licence key associated with
              that claim, in the twelve months preceding the claim.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 10 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>10. Termination</h2>
            <p style={pStyle}>
              We reserve the right to suspend or terminate your access to the Service at any
              time, with or without notice, if we believe you have violated these Terms or if
              we discontinue the Service. Upon termination, all licences granted to you under
              these Terms will cease immediately.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 11 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>11. Changes to These Terms</h2>
            <p style={pStyle}>
              We may update these Terms periodically. Material changes will be reflected by an
              updated date at the top of this page. Your continued use of the Service following
              any such changes constitutes your acceptance of the revised Terms.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 12 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>12. Governing Law</h2>
            <p style={pStyle}>
              These Terms are governed by and construed in accordance with the laws of England
              and Wales. Any disputes arising under these Terms shall be subject to the exclusive
              jurisdiction of the courts of England and Wales.
            </p>
          </div>

          <div style={dividerStyle} />

          {/* Section 13 */}
          <div style={sectionStyle}>
            <h2 style={h2Style}>13. Contact</h2>
            <p style={pStyle}>
              For questions or concerns regarding these Terms, please contact us at:
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
