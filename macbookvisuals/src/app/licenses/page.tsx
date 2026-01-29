"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  // Check auth
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
    if (!confirm("Are you sure you want to revoke this license? This action cannot be undone.")) {
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
    if (!confirm("Reset hardware binding? Customer will need to reactivate.")) {
      return;
    }

    try {
      const res = await fetch(`/api/licenses/${id}/reset`, {
        method: "POST",
      });

      if (res.ok) {
        await fetchLicenses();
        alert("✅ Hardware reset. Customer can now activate on new computer.");
      }
    } catch (error) {
      alert("Error resetting hardware");
    }
  };

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch =
      license.license_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.customer_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && license.activated && !license.revoked) ||
      (filterStatus === "unused" && !license.activated) ||
      (filterStatus === "revoked" && license.revoked);

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: licenses.length,
    active: licenses.filter((l) => l.activated && !l.revoked).length,
    unused: licenses.filter((l) => !l.activated).length,
    revoked: licenses.filter((l) => l.revoked).length,
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Loading licenses...</p>
      </div>
    );
  }

  return (
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
          <h1 style={{
            fontSize: "36px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            License Manager
          </h1>
          
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "12px 24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            + New License
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}>
          {[
            { label: "Total", value: stats.total, color: "#667eea" },
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
              <div style={{ fontSize: "14px", color: "#aaa", marginBottom: "8px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: stat.color }}>
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
            }}
          >
            <option value="all">All Licenses</option>
            <option value="active">Active</option>
            <option value="unused">Unused</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {/* Table */}
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          overflow: "hidden",
        }}>
          <div style={{
            overflowX: "auto",
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
            }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                  <th style={thStyle}>License Key</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Activated</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((license) => (
                  <tr
                    key={license.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedLicense(license)}
                  >
                    <td style={tdStyle}>
                      <code style={{ color: "#667eea" }}>{license.license_key}</code>
                    </td>
                    <td style={tdStyle}>{license.customer_name}</td>
                    <td style={tdStyle}>{license.customer_email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        background: license.revoked
                          ? "rgba(239, 68, 68, 0.2)"
                          : license.activated
                          ? "rgba(74, 222, 128, 0.2)"
                          : "rgba(251, 191, 36, 0.2)",
                        color: license.revoked
                          ? "#ef4444"
                          : license.activated
                          ? "#4ade80"
                          : "#fbbf24",
                      }}>
                        {license.revoked ? "Revoked" : license.activated ? "Active" : "Unused"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {license.activation_date
                        ? new Date(license.activation_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLicense(license);
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "rgba(102, 126, 234, 0.2)",
                          border: "none",
                          borderRadius: "6px",
                          color: "#667eea",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLicenses.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
              No licenses found
            </div>
          )}
        </div>
      </div>

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
    </main>
  );
}

// Styles
const thStyle: React.CSSProperties = {
  padding: "16px",
  textAlign: "left",
  color: "#aaa",
  fontSize: "14px",
  fontWeight: "600",
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  color: "#fff",
  fontSize: "14px",
};

// Create License Modal Component
function CreateLicenseModal({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    price_paid: "49.99",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
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
          width: "90%",
          border: "1px solid rgba(102, 126, 234, 0.3)",
        }}
      >
        <h2 style={{ marginBottom: "24px", color: "#fff" }}>Create New License</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Customer Email
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Price Paid ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price_paid}
              onChange={(e) => setFormData({ ...formData, price_paid: e.target.value })}
              required
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#aaa", fontSize: "14px" }}>
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: "white",
                resize: "none",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "12px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Create License
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// License Details Modal Component
function LicenseDetailsModal({ license, onClose, onRevoke, onResetHardware }: any) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
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
        <h2 style={{ marginBottom: "24px", color: "#fff" }}>License Details</h2>

        <div style={{ marginBottom: "24px" }}>
          {[
            { label: "License Key", value: license.license_key },
            { label: "Customer Name", value: license.customer_name },
            { label: "Customer Email", value: license.customer_email },
            { label: "Price Paid", value: `$${license.price_paid}` },
            { label: "Purchase Date", value: new Date(license.purchase_date).toLocaleString() },
            { label: "Status", value: license.revoked ? "Revoked" : license.activated ? "Active" : "Unused" },
            { label: "Activated", value: license.activation_date ? new Date(license.activation_date).toLocaleString() : "Not activated" },
            { label: "Last Verified", value: license.last_verified ? new Date(license.last_verified).toLocaleString() : "—" },
            { label: "Hardware Fingerprint", value: license.hw_fingerprint || "—" },
            { label: "Notes", value: license.notes || "—" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <span style={{ color: "#aaa" }}>{item.label}:</span>
              <span style={{ color: "#fff", fontWeight: "600", textAlign: "right" }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

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
                  padding: "12px",
                  background: "rgba(251, 191, 36, 0.2)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fbbf24",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Reset Hardware
              </button>
            )}
            <button
              onClick={() => {
                onRevoke(license.id);
                onClose();
              }}
              style={{
                flex: 1,
                padding: "12px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "none",
                borderRadius: "8px",
                color: "#ef4444",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Revoke License
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "none",
            borderRadius: "8px",
            color: "white",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}