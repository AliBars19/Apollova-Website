"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNavbar from "@/app/components/AdminNavbar";

interface License {
  id: string;
  license_key: string;
  customer_email: string;
  customer_name: string;
  purchase_date: string;
  price_paid: number;
  activated: boolean;
  activation_date: string | null;
  hw_fingerprint: string | null;
  last_verified: string | null;
  revoked: boolean;
  notes: string;
}

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  useEffect(() => {
    checkAuth();
    fetchLicenses();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      const data = await response.json();
      if (!data.authenticated) {
        router.push('/gate');
      }
    } catch (error) {
      router.push('/gate');
    }
  };

  const fetchLicenses = async () => {
    try {
      const res = await fetch("/api/licenses");
      const data = await res.json();
      setLicenses(data.licenses || []);
    } catch (error) {
      console.error("Failed to fetch licenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLicense = async (formData: any) => {
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchLicenses();
        setShowCreateModal(false);
        alert("✅ License created successfully!");
      } else {
        alert("❌ Failed to create license");
      }
    } catch (error) {
      alert("Error creating license");
    }
  };

  const handleRevokeLicense = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this license? The customer will no longer be able to use the template.")) {
      return;
    }

    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revoked: true }),
      });

      if (res.ok) {
        await fetchLicenses();
        alert("✅ License revoked");
      }
    } catch (error) {
      alert("Error revoking license");
    }
  };

  const handleResetHardware = async (id: string) => {
    if (!confirm("Reset hardware binding? The customer will need to reactivate on their computer.")) {
      return;
    }

    try {
      const res = await fetch(`/api/licenses/${id}/reset`, {
        method: "POST",
      });

      if (res.ok) {
        await fetchLicenses();
        alert("✅ Hardware reset. Customer can now activate on a new computer.");
      }
    } catch (error) {
      alert("Error resetting hardware");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("📋 Copied to clipboard!");
  };

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && license.activated && !license.revoked) ||
      (filterStatus === "unused" && !license.activated && !license.revoked) ||
      (filterStatus === "revoked" && license.revoked);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.activated && !l.revoked).length,
    unused: licenses.filter((l) => !l.activated && !l.revoked).length,
    revoked: licenses.filter((l) => l.revoked).length,
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div style={{ 
          minHeight: '100vh', 
          background: '#050509', 
          paddingTop: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{ color: '#aaa' }}>Loading licenses...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <main style={{
        minHeight: "100vh",
        background: "#050509",
        padding: "100px 20px 40px",
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Header */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}>
            <div>
              <h1 style={{
                fontSize: "32px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "8px",
              }}>
                License Manager
              </h1>
              <p style={{ color: '#888', fontSize: '14px' }}>
                Manage customer licenses for your After Effects template
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: "14px 28px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "10px",
                color: "white",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
            >
              + Generate New License
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}>
            {[
              { label: "Total Licenses", value: stats.total, color: "#667eea" },
              { label: "Active", value: stats.active, color: "#4ade80" },
              { label: "Unused", value: stats.unused, color: "#fbbf24" },
              { label: "Revoked", value: stats.revoked, color: "#ef4444" },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "24px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: "36px", fontWeight: "bold", color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}>
            <input
              type="text"
              placeholder="Search by key, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: "250px",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
              }}
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "14px",
                cursor: 'pointer',
              }}
            >
              <option value="all">All Licenses</option>
              <option value="active">Active</option>
              <option value="unused">Unused</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>

          {/* License Table */}
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            {/* Table Header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1fr 1fr 120px",
              gap: "16px",
              padding: "16px 24px",
              background: "rgba(255, 255, 255, 0.03)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: "13px",
              fontWeight: "600",
              color: "#888",
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              <div>License Key</div>
              <div>Customer</div>
              <div>Status</div>
              <div>Price</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            {filteredLicenses.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#666" }}>
                {licenses.length === 0 
                  ? "No licenses yet. Click 'Generate New License' to create one!"
                  : "No licenses match your search."
                }
              </div>
            ) : (
              filteredLicenses.map((license) => (
                <div
                  key={license.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.5fr 1fr 1fr 120px",
                    gap: "16px",
                    padding: "20px 24px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    alignItems: "center",
                    transition: 'background 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* License Key */}
                  <div>
                    <div 
                      style={{ 
                        fontFamily: "monospace", 
                        fontSize: "14px", 
                        color: "#fff",
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                      onClick={() => copyToClipboard(license.license_key)}
                      title="Click to copy"
                    >
                      {license.license_key}
                      <span style={{ fontSize: '12px', color: '#667eea' }}>📋</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: '4px' }}>
                      Created {new Date(license.purchase_date).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Customer */}
                  <div>
                    <div style={{ fontSize: "14px", color: "#fff" }}>
                      {license.customer_name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888" }}>
                      {license.customer_email}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <span style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background: license.revoked 
                        ? "rgba(239, 68, 68, 0.15)" 
                        : license.activated 
                          ? "rgba(74, 222, 128, 0.15)" 
                          : "rgba(251, 191, 36, 0.15)",
                      color: license.revoked 
                        ? "#ef4444" 
                        : license.activated 
                          ? "#4ade80" 
                          : "#fbbf24",
                    }}>
                      {license.revoked ? "Revoked" : license.activated ? "Active" : "Unused"}
                    </span>
                  </div>

                  {/* Price */}
                  <div style={{ fontSize: "14px", color: "#fff" }}>
                    £{license.price_paid.toFixed(2)}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => setSelectedLicense(license)}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(102, 126, 234, 0.15)",
                        border: "none",
                        borderRadius: "6px",
                        color: "#667eea",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Create License Modal */}
      {showCreateModal && (
        <CreateLicenseModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateLicense}
        />
      )}

      {/* License Details Modal */}
      {selectedLicense && (
        <LicenseDetailsModal
          license={selectedLicense}
          onClose={() => setSelectedLicense(null)}
          onRevoke={handleRevokeLicense}
          onResetHardware={handleResetHardware}
        />
      )}
    </>
  );
}

// Create License Modal
function CreateLicenseModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    price_paid: "250.00",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      price_paid: parseFloat(formData.price_paid),
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0a0f",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "500px",
          width: "100%",
          border: "1px solid rgba(102, 126, 234, 0.3)",
        }}
      >
        <h2 style={{ marginBottom: "8px", color: "#fff", fontSize: "24px" }}>
          Generate New License
        </h2>
        <p style={{ marginBottom: "24px", color: "#888", fontSize: "14px" }}>
          Create a license key for a new customer
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
              placeholder="John Doe"
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "15px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Customer Email *
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              required
              placeholder="john@example.com"
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "15px",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Price Paid (£) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price_paid}
              onChange={(e) => setFormData({ ...formData, price_paid: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                fontSize: "15px",
              }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional notes about this sale..."
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                resize: "none",
                fontSize: "15px",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "14px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Generate License
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// License Details Modal
function LicenseDetailsModal({ 
  license, 
  onClose, 
  onRevoke, 
  onResetHardware 
}: { 
  license: License; 
  onClose: () => void; 
  onRevoke: (id: string) => void;
  onResetHardware: (id: string) => void;
}) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("📋 Copied to clipboard!");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0a0a0f",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "600px",
          width: "100%",
          border: "1px solid rgba(102, 126, 234, 0.3)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginBottom: "24px", color: "#fff", fontSize: "24px" }}>
          License Details
        </h2>

        {/* License Key - Prominent */}
        <div style={{
          padding: "20px",
          background: "rgba(102, 126, 234, 0.1)",
          border: "1px solid rgba(102, 126, 234, 0.3)",
          borderRadius: "12px",
          marginBottom: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px", textTransform: 'uppercase', letterSpacing: '1px' }}>
            License Key
          </div>
          <div 
            style={{ 
              fontFamily: "monospace", 
              fontSize: "24px", 
              color: "#667eea",
              cursor: 'pointer',
            }}
            onClick={() => copyToClipboard(license.license_key)}
            title="Click to copy"
          >
            {license.license_key}
          </div>
          <button
            onClick={() => copyToClipboard(license.license_key)}
            style={{
              marginTop: '12px',
              padding: '8px 16px',
              background: 'rgba(102, 126, 234, 0.2)',
              border: 'none',
              borderRadius: '6px',
              color: '#667eea',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            📋 Copy to Clipboard
          </button>
        </div>

        {/* Details Grid */}
        <div style={{ marginBottom: "24px" }}>
          {[
            { label: "Customer Name", value: license.customer_name },
            { label: "Customer Email", value: license.customer_email },
            { label: "Price Paid", value: `£${license.price_paid.toFixed(2)}` },
            { label: "Purchase Date", value: new Date(license.purchase_date).toLocaleString() },
            { label: "Status", value: license.revoked ? "🔴 Revoked" : license.activated ? "🟢 Active" : "🟡 Unused" },
            { label: "Activated", value: license.activation_date ? new Date(license.activation_date).toLocaleString() : "Not activated" },
            { label: "Last Verified", value: license.last_verified ? new Date(license.last_verified).toLocaleString() : "Never" },
            { label: "Hardware Fingerprint", value: license.hw_fingerprint || "Not bound" },
            { label: "Notes", value: license.notes || "—" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span style={{ color: "#888", fontSize: "14px" }}>{item.label}</span>
              <span style={{ 
                color: "#fff", 
                fontWeight: "500", 
                textAlign: "right",
                maxWidth: '60%',
                wordBreak: 'break-all',
                fontSize: "14px",
              }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {!license.revoked && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            {license.activated && (
              <button
                onClick={() => {
                  onResetHardware(license.id);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "rgba(251, 191, 36, 0.15)",
                  border: "1px solid rgba(251, 191, 36, 0.3)",
                  borderRadius: "8px",
                  color: "#fbbf24",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                🔄 Reset Hardware
              </button>
            )}
            <button
              onClick={() => {
                onRevoke(license.id);
                onClose();
              }}
              style={{
                flex: 1,
                padding: "14px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#ef4444",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ⛔ Revoke License
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
            fontSize: "15px",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
