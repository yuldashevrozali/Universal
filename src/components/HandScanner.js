"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];
const TIPS = [4, 8, 12, 16, 20];
const HOLD_MS = 10000;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Skript yuklashda xatolik"));
    document.head.appendChild(s);
  });
}

function isOpenHand(lm) {
  return [
    Math.abs(lm[4].x - lm[2].x) > 0.04,
    lm[8].y < lm[6].y,
    lm[12].y < lm[10].y,
    lm[16].y < lm[14].y,
    lm[20].y < lm[18].y,
  ].filter(Boolean).length >= 4;
}

function drawHand(ctx, lm, w, h, open) {
  ctx.strokeStyle = open ? "#34d399" : "#6c8cff";
  ctx.lineWidth = 2.5;
  CONNECTIONS.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  });
  lm.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, TIPS.includes(i) ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = TIPS.includes(i) ? (open ? "#34d399" : "#6c8cff") : "#fff";
    ctx.fill();
  });
}

export default function HandScanner({ onScan, onCancel, title = "Qo'l skaneri" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const stateRef = useRef({ stopped: false, hands: null, raf: null, stream: null });
  const openStartRef = useRef(null);
  const scannedRef = useRef(false);

  const [status, setStatus] = useState("Kamera ochilmoqda...");
  const [detected, setDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(10);

  const cleanup = useCallback(() => {
    const s = stateRef.current;
    s.stopped = true;
    cancelAnimationFrame(s.raf);
    s.stream?.getTracks().forEach((t) => t.stop());
    s.hands?.close?.();
  }, []);

  useEffect(() => {
    const s = stateRef.current;
    s.stopped = false;
    scannedRef.current = false;

    async function run() {
      try {
        await loadScript(
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js"
        );
        if (s.stopped) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        s.stream = stream;
        if (s.stopped) { stream.getTracks().forEach((t) => t.stop()); return; }

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        const hands = new window.Hands({
          locateFile: (f) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`,
        });
        s.hands = hands;
        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results) => {
          if (s.stopped || scannedRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          ctx.restore();

          const lmList = results.multiHandLandmarks;
          if (lmList?.length > 0) {
            const lm = lmList[0];
            const mirrored = lm.map((p) => ({ ...p, x: 1 - p.x }));
            const open = isOpenHand(lm);
            drawHand(ctx, mirrored, canvas.width, canvas.height, open);

            if (open) {
              if (!openStartRef.current) openStartRef.current = Date.now();
              const elapsed = Date.now() - openStartRef.current;
              const pct = Math.min(100, Math.round((elapsed / HOLD_MS) * 100));
              const secs = Math.max(0, Math.ceil((HOLD_MS - elapsed) / 1000));
              setDetected(true);
              setProgress(pct);
              setCountdown(secs);
              setStatus(secs > 0 ? `Ushlang... ${secs} soniya` : "Saqlanmoqda...");

              if (elapsed >= HOLD_MS && !scannedRef.current) {
                scannedRef.current = true;
                s.stopped = true;
                onScan(lm.flatMap((p) => [p.x, p.y, p.z]));
              }
            } else {
              openStartRef.current = null;
              setDetected(false);
              setProgress(0);
              setCountdown(10);
              setStatus("Barcha 5 barmoqni oching va ushlang...");
            }
          } else {
            openStartRef.current = null;
            setDetected(false);
            setProgress(0);
            setCountdown(10);
            setStatus("Qo'lingizni kameraga ko'rsating...");
          }
        });

        setStatus("Qo'lingizni kameraga ko'rsating...");

        async function frame() {
          if (s.stopped) return;
          if (video.readyState >= 2) await hands.send({ image: video });
          s.raf = requestAnimationFrame(frame);
        }
        s.raf = requestAnimationFrame(frame);
      } catch (e) {
        setStatus("Xatolik: " + (e.message || "kamera ochilmadi"));
      }
    }

    run();
    return cleanup;
  }, [onScan, cleanup]);

  const circumference = 2 * Math.PI * 52;

  return (
    <div className="scanner-overlay">
      <div className="scanner-box">
        <div className="scanner-header">
          <span className="scanner-ic">✋</span>
          <h3 style={{ margin: 0 }}>{title}</h3>
        </div>

        <div className="scanner-video-wrap">
          <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className={`scanner-canvas ${detected ? "detected" : ""}`}
          />

          {/* Ring countdown overlay */}
          {detected && (
            <div className="scanner-ring">
              <svg viewBox="0 0 120 120" width={100} height={100}>
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth="7" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="#34d399" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress / 100)}
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dashoffset 0.15s linear" }}
                />
              </svg>
              <span className="scanner-ring-pct">{countdown > 0 ? countdown : "✓"}</span>
            </div>
          )}
        </div>

        <p className="scanner-status" style={{ color: detected ? "var(--green)" : "var(--muted)" }}>
          {status}
        </p>

        {/* Mini progress bar */}
        {detected && (
          <div style={{ width: "100%", height: 4, background: "var(--bg2)", borderRadius: 99 }}>
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg, var(--green), #6ee7b7)",
                width: `${progress}%`,
                transition: "width 0.15s linear",
              }}
            />
          </div>
        )}

        <button
          className="btn ghost"
          style={{ marginTop: 4 }}
          onClick={() => { cleanup(); onCancel(); }}
        >
          Bekor qilish
        </button>
      </div>
    </div>
  );
}
