"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PasswordGate() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        // Get redirect destination from cookie or default to dashboard
        const cookies = document.cookie.split(';');
        const redirectCookie = cookies.find(c => c.trim().startsWith('redirect_after_gate='));
        const destination = redirectCookie 
          ? decodeURIComponent(redirectCookie.split('=')[1]) 
          : '/dashboard';
        
        console.log('Redirecting to:', destination);
        router.push(destination);
      } else {
        setError("Incorrect password");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
      }}
    >
      <div
        style={{
          background: "rgba(26, 26, 46, 0.8)",
          padding: "48px",
          borderRadius: "24px",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          maxWidth: "400px",
          width: "90%",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              background: "linear-gradient(to right, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "8px",
            }}
          >
            MacBook Visuals
          </h1>
          <p style={{ color: "#aaa", fontSize: "14px" }}>
            Private Access
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                color: "#ccc",
                fontSize: "14px",
                marginBottom: "8px",
              }}
            >
              Enter Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                color: "white",
                fontSize: "16px",
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(139, 92, 246, 0.5)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(255, 255, 255, 0.1)";
              }}
              required
            />
          </div>

          {error && (
            <div
              style={{
                padding: "12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#ef4444",
                fontSize: "14px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: loading
                ? "#555"
                : "linear-gradient(to right, #8b5cf6, #ec4899)",
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {loading ? "Checking..." : "Enter"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "rgba(139, 92, 246, 0.05)",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#888", fontSize: "12px", margin: 0 }}>
            🔒 This site is password protected
          </p>
        </div>
      </div>
    </div>
  );
}
