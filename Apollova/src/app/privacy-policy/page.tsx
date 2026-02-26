"use client";

import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import { useTheme } from "@/context/ThemeContext";

export default function PrivacyPolicyPage() {
  const { colors } = useTheme();

  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect only what is necessary to operate the platform. This includes licence key identifiers, device identifiers associated with activations, and activation timestamps. When you connect a TikTok or YouTube account, we store the OAuth access and refresh tokens provided by those platforms — used exclusively to publish content on your behalf. We do not store your social media passwords. Video files you upload are held temporarily to facilitate scheduling and publishing. We also collect titles, descriptions, captions, and scheduling data associated with your videos. On our public website pages, Google Analytics collects anonymised, aggregated usage data (page views, session duration, device type) that does not identify you personally.",
    },
    {
      title: "2. Information We Do Not Collect",
      content: "We do not collect or store your name, email address, or physical address, payment information (handled externally), social media passwords or login credentials, IP addresses for tracking or profiling, or cookies beyond those set by Google Analytics.",
    },
    {
      title: "3. How We Use Your Information",
      content: "We use the information collected solely to verify your licence and grant platform access, authenticate your connected social accounts via OAuth, store and schedule your video content for automated publishing, post content to TikTok on your behalf at scheduled times, and understand aggregate website usage to improve the Service. We do not use your data for advertising, profiling, or any purpose beyond delivering the core Service.",
    },
    {
      title: "4. Third-Party Services",
      content: "TikTok API is used to publish scheduled videos to your TikTok account, subject to TikTok's Privacy Policy. YouTube OAuth is used for authenticated access to YouTube as part of the Apollova installer's audio download pipeline, subject to Google's Privacy Policy. Google Analytics is used to collect anonymised website usage statistics on our public marketing pages — data is aggregated and does not identify individual visitors, subject to Google's Privacy Policy.",
    },
    {
      title: "5. Data Retention",
      content: "Uploaded videos are stored temporarily and removed after successful publication or upon user deletion. OAuth tokens are retained while your account connection is active and removed when you disconnect the integration. Licence records are retained for the duration of your licence for verification and support purposes. Video metadata is retained until you delete a video or terminate access to the platform.",
    },
    {
      title: "6. Data Security",
      content: "We implement appropriate technical measures to protect the data we hold, including encrypted storage of OAuth tokens and authenticated access controls. No method of transmission over the internet is completely secure. We encourage you to disconnect unused integrations promptly.",
    },
    {
      title: "7. Children's Privacy",
      content: "The Apollova platform is not intended for use by individuals under the age of 13. We do not knowingly collect any information from children. If you believe a minor has provided data through our Service, please contact us and we will take steps to remove that information.",
    },
    {
      title: "8. Your Rights",
      content: "Depending on your location, you may have rights regarding your personal data, including the right to request access, correction, or deletion. To exercise any of these rights, or to request the removal of your connected account tokens or uploaded content, please contact us directly.",
    },
    {
      title: "9. Changes to This Policy",
      content: "We may update this Privacy Policy from time to time. Updates will be reflected by the date at the top of this page. Your continued use of the Service after any changes constitutes acceptance of the updated Policy.",
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
            Privacy Policy
          </h1>
          <p style={{
            color: colors.textSecondary,
            fontSize: "clamp(13px, 2vw, 15px)",
            lineHeight: "1.8",
            marginBottom: "12px",
          }}>
            This Privacy Policy explains how Apollova collects, uses, and protects information
            when you use our website and platform at apollova.co.uk.
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
            For any data-related requests or questions about this policy, get in touch.
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
