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

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.crossOrigin = "anonymous";
    s.onload = resolve;
    s.onerror = () => reject(new Error("Skript yuklashda xatolik: " + src));
    document.head.appendChild(s);
  });
}

function isOpenHand(lm) {
  const fingers = [
    Math.abs(lm[4].x - lm[2].x) > 0.04,
    lm[8].y < lm[6].y,
    lm[12].y < lm[10].y,
    lm[16].y < lm[14].y,
    lm[20].y < lm[18].y,
  ];
  return fingers.filter(Boolean).length >= 4;
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
  const stateRef = useRef({ stopped: false, hands: null, raf: null, confirmTimer: null, stream: null });
  const [status, setStatus] = useState("Kamera ochilmoqda...");
  const [detected, setDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const scannedRef = useRef(false);

  const cleanup = useCallback(() => {
    const s = stateRef.current;
    s.stopped = true;
    clearTimeout(s.confirmTimer);
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

        let openFrames = 0;
        const NEEDED_FRAMES = 20;

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
              openFrames = Math.min(openFrames + 1, NEEDED_FRAMES);
              setDetected(true);
              setProgress(Math.round((openFrames / NEEDED_FRAMES) * 100));
              setStatus(openFrames >= NEEDED_FRAMES ? "Saqlanmoqda..." : "Qo'lingizni ushlang...");
              if (openFrames >= NEEDED_FRAMES && !scannedRef.current) {
                scannedRef.current = true;
                const flat = lm.flatMap((p) => [p.x, p.y, p.z]);
                s.stopped = true;
                onScan(flat);
              }
            } else {
              openFrames = Math.max(0, openFrames - 2);
              setDetected(false);
              setProgress(0);
              setStatus("Barcha 5 barmoqni oching va ushlang...");
            }
          } else {
            openFrames = 0;
            setDetected(false);
            setProgress(0);
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
          {detected && progress < 100 && (
            <div className="scanner-ring">
              <svg viewBox="0 0 100 100" width="80" height="80">
                <circle cx="50" cy="50" r="44" fill="none" stroke="#2a3150" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="none"
                  stroke="#34d399" strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 0.1s" }}
                />
              </svg>
              <span className="scanner-ring-pct">{progress}%</span>
            </div>
          )}
        </div>
        <p
          className="scanner-status"
          style={{ color: detected ? "var(--green)" : "var(--muted)" }}
        >
          {status}
        </p>
        <button className="btn ghost" style={{ marginTop: 4 }} onClick={() => { cleanup(); onCancel(); }}>
          Bekor qilish
        </button>
      </div>
    </div>
  );
}
