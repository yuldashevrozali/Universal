"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const OPTIONS = [25, 50];

function fmt(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h > 0) return `${h} soat ${m} daq`;
  return `${m} daq`;
}
function mmss(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Web Audio orqali "ding" ovozi (fayl kerak emas)
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.start(t);
      o.stop(t + 0.6);
    });
  } catch {}
}

export default function GrindPage() {
  const [target, setTarget] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stats, setStats] = useState(null);
  const intervalRef = useRef(null);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/grind");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Targetni o'zgartirganda timerni qayta tiklash (faqat ishlamayotgan bo'lsa)
  useEffect(() => {
    if (!running && !finished) setRemaining(target * 60);
  }, [target, running, finished]);

  const saveSession = useCallback(async (elapsedSec, completed) => {
    const minutes = elapsedSec / 60;
    if (minutes < 0.5) return; // juda qisqa sessiyalarni saqlamaymiz
    await fetch("/api/grind", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes, targetMinutes: target, completed }),
    });
    loadStats();
  }, [target, loadStats]);

  // Timer yuritish
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setFinished(true);
          playChime();
          saveSession(target * 60, true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, target, saveSession]);

  function start() { setFinished(false); setRunning(true); }
  function pause() { setRunning(false); }

  function stop() {
    // Tugatish: o'tirilgan vaqtni saqlaymiz (to'liq emas)
    clearInterval(intervalRef.current);
    const elapsed = target * 60 - remaining;
    setRunning(false);
    if (elapsed > 0 && !finished) saveSession(elapsed, false);
    setRemaining(target * 60);
    setFinished(false);
  }

  function reset() {
    setFinished(false);
    setRunning(false);
    setRemaining(target * 60);
  }

  const progress = 1 - remaining / (target * 60);
  const deg = Math.round(progress * 360);

  return (
    <div>
      <h1 className="page-title">Grind</h1>
      <p className="page-sub">Diqqatni jamlang. 25 yoki 50 daqiqalik sessiya tanlang.</p>

      <div className="card" style={{ marginBottom: 20, textAlign: "center" }}>
        <div className="row" style={{ justifyContent: "center", marginBottom: 26 }}>
          {OPTIONS.map((o) => (
            <button
              key={o}
              className={`pill ${target === o ? "active" : ""}`}
              disabled={running}
              onClick={() => setTarget(o)}
            >
              {o} daqiqa
            </button>
          ))}
        </div>

        <div
          className={`timer-ring ${finished ? "celebrate" : ""}`}
          style={{
            width: 240, height: 240, borderRadius: "50%", margin: "0 auto 24px",
            background: `conic-gradient(var(--accent) ${deg}deg, var(--line) 0deg)`,
          }}
        >
          <div style={{
            width: 200, height: 200, borderRadius: "50%", background: "var(--card)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            <div className="timer-num">{finished ? "🎉" : mmss(remaining)}</div>
            {finished && <div style={{ color: "var(--green)", fontWeight: 700 }}>Tugadi!</div>}
          </div>
        </div>

        <div className="row" style={{ justifyContent: "center", maxWidth: 420, margin: "0 auto" }}>
          {!running && !finished && (
            <button className="btn auto" onClick={start}>▶ Boshlash</button>
          )}
          {running && (
            <button className="btn secondary auto" onClick={pause}>⏸ To'xtatib turish</button>
          )}
          {!running && remaining < target * 60 && !finished && (
            <button className="btn auto" onClick={start}>▶ Davom etish</button>
          )}
          {(running || (remaining < target * 60 && !finished)) && (
            <button className="btn danger auto" onClick={stop}>⏹ Tugatish</button>
          )}
          {finished && (
            <button className="btn auto" onClick={reset}>Yana boshlash</button>
          )}
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="stat">{stats ? fmt(stats.day) : "…"}</div>
          <div className="stat-label">Bugun</div>
        </div>
        <div className="card">
          <div className="stat">{stats ? fmt(stats.week) : "…"}</div>
          <div className="stat-label">Shu hafta</div>
        </div>
        <div className="card">
          <div className="stat">{stats ? fmt(stats.month) : "…"}</div>
          <div className="stat-label">Shu oy</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>So'nggi sessiyalar</h3>
        {stats && stats.recent.length === 0 && <p className="muted">Hali sessiya yo'q.</p>}
        {stats && stats.recent.map((s, i) => (
          <div key={i} className="todo" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{s.completed ? "✅" : "⏹"}</span>
            <span className="todo-text">{fmt(s.minutes)} <span className="muted">/ {s.target} daq maqsad</span></span>
            <span className="muted" style={{ fontSize: 13 }}>{s.dateKey}</span>
          </div>
        ))}
        {stats && <p className="muted" style={{ marginBottom: 0 }}>Jami: <b>{fmt(stats.all)}</b> · {stats.count} sessiya</p>}
      </div>
    </div>
  );
}
