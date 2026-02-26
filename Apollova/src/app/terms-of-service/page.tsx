"use client";
// Terms of Service Page
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import { useTheme } from "@/context/ThemeContext";

export default function TermsPage() {
  const { colors } = useTheme();

  const sections = [
    {
      title: "1. Description of the Service",
      content: "Apollova is a professional platform for creating and scheduling AI-powered lyric videos. The Service allows licensed users to upload rendered video files, connect social media accounts (TikTok, YouTube), and schedule content for automated publishing. The website also showcases our three After Effects video templates — Aurora, Mono, and Onyx.",
    },
    {
      title: "2. Eligibility & Licence Keys",
      content: "Access to the Apollova platform requires a valid licence key. Licence keys are issued by Apollova and are personal, non-transferable, and non-refundable unless otherwise agreed in writing. You agree to keep your licence key confidential, not share or sell it to any third party, notify us immediately if you believe your key has been compromised, and use a maximum of one active device per licence unless explicitly permitted. We reserve the right to revoke a licence key at any time if these Terms are violated.",
    },
    {
      title: "3. User Content & Uploads",
      content: "You retain full ownership of any content you upload to the Service. By uploading content, you grant Apollova a limited, non-exclusive, royalty-free licence to store, process, and publish that content on your behalf in accordance with your scheduling instructions. You represent and warrant that you own or hold sufficient rights to all content you upload — including music, imagery, and lyrics — that your content does not infringe any third-party intellectual property rights, that it complies with TikTok's Community Guidelines, and that it does not contain unlawful, harmful, or malicious material. Uploaded videos are stored temporarily for scheduling and publishing, and are not repurposed or shared beyond the scheduled publishing destination.",
    },
    {
      title: "4. Third-Party Integrations",
      content: "The Service integrates with TikTok and YouTube to enable OAuth-based authentication and automated content posting. By connecting these accounts, you authorise Apollova to publish content on your behalf according to your scheduling configuration. Your use of these integrations is additionally governed by the terms and privacy policies of those platforms. Apollova is not responsible for any changes to third-party APIs, account suspensions, or restrictions imposed by those platforms. You may disconnect any integration at any time from within the platform.",
    },
    {
      title: "5. Acceptable Use",
      content: "You agree not to upload content that infringes copyright or other intellectual property rights, submit malicious files or disruptive code to the Service, attempt to reverse-engineer or tamper with the platform, circumvent licence verification or security measures, use the Service to spam or deceive any person or platform, or use automated tools to place excessive load on our infrastructure.",
    },
    {
      title: "6. Scheduling & Publishing",
      content: "The platform schedules content for automated posting within configurable parameters (e.g. up to 12 videos per day). Apollova does not guarantee specific posting times, reach, engagement, or platform approval of scheduled content. Publishing is contingent on the availability of connected third-party APIs and your account remaining in good standing on those platforms.",
    },
    {
      title: "7. Intellectual Property",
      content: "All Apollova branding, templates (Aurora, Mono, Onyx), software, design, and website content are the intellectual property of Apollova and are protected by copyright and other applicable laws. You may not reproduce, distribute, or create derivative works from our materials without prior written consent.",
    },
    {
      title: "8. Disclaimer of Warranties",
      content: "The Service is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or free from harmful components.",
    },
    {
      title: "9. Limitation of Liability",
      content: "To the fullest extent permitted by applicable law, Apollova shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. Our total liability for any claim shall not exceed the amount paid by you for the licence key associated with that claim in the twelve months preceding the claim.",
    },
    {
      title: "10. Termination",
      content: "We reserve the right to suspend or terminate your access to the Service at any time, with or without notice, if we believe you have violated these Terms or if we discontinue the Service. Upon termination, all licences granted to you under these Terms will cease immediately.",
    },
    {
      title: "11. Changes to These Terms",
      content: "We may update these Terms periodically. Material changes will be reflected by an updated date at the top of this page. Your continued use of the Service following any such changes constitutes acceptance of the revised Terms.",
    },
    {
      title: "12. Governing Law",
      content: "These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
    },
  ];

  return (
    <>
      <PublicNavbar />
      <main style={{
        minHeight: "100vh",
        background: colors.background,
        transition: "all 0.3s ease",
      }}>

        {/* Hero */}
        <section style={{
          padding: "clamp(120px, 15vw, 160px) 20px clamp(60px, 10vw, 100px)",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}>
          <h1 style={{
            fontSize: "clamp(36px, 8vw, 64px)",
            fontWeight: "300",
            color: colors.text,
            marginBottom: "20px",
            letterSpacing: "-2px",
          }}>
            Terms of Service
          </h1>
          <p style={{
            color: colors.textSecondary,
            fontSize: "clamp(13px, 2vw, 15px)",
            lineHeight: "1.8",
            marginBottom: "12px",
          }}>
            These Terms govern your access to and use of the Apollova website and platform
            at apollova.co.uk. By using the Service, you agree to be bound by these Terms.
          </p>
          <p style={{
            color: colors.textSecondary,
            fontSize: "12px",
            letterSpacing: "1px",
          }}>
            Last updated: 26 February 2026
          </p>
        </section>

        {/* Sections */}
        <section style={{
          background: colors.backgroundSecondary,
          padding: "clamp(60px, 10vw, 100px) 20px",
        }}>
          <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "clamp(32px, 5vw, 56px)",
          }}>
            {sections.map((section, index) => (
              <div key={index}>
                <h2 style={{
                  fontSize: "clamp(16px, 2.5vw, 20px)",
                  fontWeight: "500",
                  color: colors.text,
                  marginBottom: "14px",
                  letterSpacing: "-0.3px",
                }}>
                  {section.title}
                </h2>
                <p style={{
                  color: colors.textSecondary,
                  fontSize: "clamp(14px, 2vw, 15px)",
                  lineHeight: "1.85",
                  margin: "0",
                }}>
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section style={{
          padding: "clamp(60px, 10vw, 100px) 20px",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}>
          <h2 style={{
            fontSize: "clamp(24px, 4vw, 40px)",
            fontWeight: "300",
            color: colors.text,
            marginBottom: "20px",
            letterSpacing: "-1px",
          }}>
            Questions?
          </h2>
          <p style={{
            color: colors.textSecondary,
            fontSize: "clamp(14px, 2vw, 16px)",
            lineHeight: "1.8",
            marginBottom: "24px",
          }}>
            For anything regarding these Terms, get in touch.
          </p>
          <a
            href="mailto:contact@apollova.co.uk"
            style={{
              fontSize: "clamp(18px, 3vw, 28px)",
              color: colors.text,
              textDecoration: "none",
              borderBottom: `1px solid ${colors.text}`,
              paddingBottom: "6px",
            }}
          >
            contact@apollova.co.uk
          </a>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
