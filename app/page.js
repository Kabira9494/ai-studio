"use client";

import { useState, useEffect, useRef } from "react";

const PW_KEY = "aistudio.accesscode";

export default function Home() {
  const [code, setCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [prompt, setPrompt] = useState("a red panda knight in golden armour, cinematic lighting");
  const [type, setType] = useState("image");
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [output, setOutput] = useState(null);
  const [outputType, setOutputType] = useState("image");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PW_KEY);
      if (saved) setCode(saved);
    } catch {}
  }, []);

  function saveCode(e) {
    e.preventDefault();
    const c = codeInput.trim();
    if (!c) return;
    setCode(c);
    try { localStorage.setItem(PW_KEY, c); } catch {}
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  async function generate() {
    const p = prompt.trim();
    if (!p || busy) return;

    setBusy(true);
    setError("");
    setOutput(null);
    setOutputType(type);
    setStatusText(type === "video" ? "Starting video job — this can take a minute or two…" : "Starting…");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-app-password": code },
        body: JSON.stringify({ prompt: p, type }),
      });
      const data = await res.json();

      if (res.status === 401) {
        setCode("");
        try { localStorage.removeItem(PW_KEY); } catch {}
        throw new Error("Access code was rejected. Re-enter it.");
      }
      if (!res.ok) throw new Error(data.error || "Request failed.");
      if (typeof data.remaining === "number") setRemaining(data.remaining);

      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`/api/status?id=${data.id}`);
          const sd = await s.json();
          if (!s.ok) throw new Error(sd.error || "Status check failed.");

          if (sd.status === "succeeded" && sd.output) {
            stopPolling(); setOutput(sd.output); setStatusText(""); setBusy(false);
          } else if (sd.status === "failed" || sd.status === "canceled") {
            stopPolling(); setError(sd.error || "Generation failed. Try a different prompt."); setStatusText(""); setBusy(false);
          } else {
            setStatusText(type === "video" ? "Rendering your video…" : "Rendering your image…");
          }
        } catch (e) {
          stopPolling(); setError(e.message); setStatusText(""); setBusy(false);
        }
      }, 2500);
    } catch (e) {
      setError(e.message); setStatusText(""); setBusy(false);
    }
  }

  if (!code) {
    return (
      <div className="wrap">
        <div className="brand"><span className="mark" />AI Studio</div>
        <h1>Enter your <em>access code</em></h1>
        <p className="sub">This keeps the generator private so only people you share the code with can use it.</p>
        <form className="panel" onSubmit={saveCode}>
          <input
            className="code-input"
            type="password"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Access code"
            aria-label="Access code"
            autoFocus
          />
          <div className="row">
            <button className="go" type="submit" style={{ marginLeft: "auto" }}>Enter →</button>
          </div>
        </form>
        <footer>
          Set the code on the server as <code>APP_PASSWORD</code>. No code set? Type anything to continue.
        </footer>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="brand"><span className="mark" />AI Studio</div>

      <h1>Describe it. <em>Watch it generate.</em></h1>
      <p className="sub">
        Type a prompt, pick image or video, and the model renders it live.
      </p>

      <div className="panel">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to create…"
          aria-label="Prompt"
        />
        <div className="row">
          <div className="modes" role="group" aria-label="Output type">
            <button type="button" data-on={type === "image"} onClick={() => setType("image")}>🖼 Image</button>
            <button type="button" data-on={type === "video"} onClick={() => setType("video")}>🎬 Video</button>
          </div>
          <button className="go" onClick={generate} disabled={busy}>
            {busy ? "Generating…" : "Build it →"}
          </button>
        </div>
      </div>

      {remaining !== null && (
        <p className="quota">{remaining} generation{remaining === 1 ? "" : "s"} left today</p>
      )}

      <div className="stage">
        {error ? (
          <p className="err">{error}</p>
        ) : output ? (
          outputType === "video" ? (
            <video src={output} controls autoPlay loop muted playsInline />
          ) : (
            <img src={output} alt={prompt} />
          )
        ) : busy ? (
          <div className="status"><span className="spinner" />{statusText}</div>
        ) : (
          <p className="hint">Your result will appear here.</p>
        )}
      </div>

      {output && !error && (
        <div className="result-actions">
          <a href={output} target="_blank" rel="noopener">Open full size ↗</a>
          <a href={output} download target="_blank" rel="noopener">Download</a>
        </div>
      )}

      <footer>
        Powered by your own <code>REPLICATE_API_TOKEN</code>. Each generation uses real credits —
        images cost a few cents, videos more.
      </footer>
    </div>
  );
}
