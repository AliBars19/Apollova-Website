"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const upload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.ok ? "Uploaded!" : "Failed");
  };

  return (
    <main className="upload-page">
      <h1>Upload One Video</h1>

      <input
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={upload} disabled={!file}>
        Upload
      </button>

      {message && <p>{message}</p>}
    </main>
  );
}
