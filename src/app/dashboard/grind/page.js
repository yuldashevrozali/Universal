"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const OPTIONS = [10, 25, 50];

function fmt(totalMin) {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h > 0) return `${h} soat ${m} daq`;
  return `${m} daq`;
}
function mmss(sec) {
  const s = Math.max(0, sec);
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

// Web Audio orqali "ding" ovozi (fayl kerak emas)
function playChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    if (ctx.state === "suspended") ctx.resume();
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

  // Tugash vaqti (timestamp, ms) — vaqt shu yerdan hisoblanadi,
  // shuning uchun tab orqada bo'lsa ham (setInterval sekinlashsa ham) aniq qoladi.
  const endRef = useRef(0);
  const finishedRef = useRef(false);

  const loadStats = useCallback(async () => {
    const res = await fetch("/api/grind");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Target o'zgarsa, ishlamayotgan paytda timerni qayta tiklash
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

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    setFinished(true);
    setRemaining(0);
    playChime();
    saveSession(target * 60, true);
  }, [target, saveSession]);

  // Haqiqiy vaqt bo'yicha qolgan vaqtni hisoblash
  const tick = useCallback(() => {
    const rem = Math.round((endRef.current - Date.now()) / 1000);
    if (rem <= 0) finish();
    else setRemaining(rem);
  }, [finish]);

  // Timer yuritish + tabga qaytganda darhol qayta hisoblash
  useEffect(() => {
    if (!running) return;
    tick();
    const iv = setInterval(tick, 1000);
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [running, tick]);

  function start() {
    finishedRef.current = false;
    setFinished(false);
    endRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }

  function pause() {
    const rem = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
    setRemaining(rem);
    setRunning(false);
  }

  function stop() {
    const rem = running
      ? Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      : remaining;
    const elapsed = target * 60 - rem;
    setRunning(false);
    if (elapsed > 0 && !finishedRef.current) saveSession(elapsed, false);
    setRemaining(target * 60);
    setFinished(false);
    finishedRef.current = false;
  }

  function reset() {
    setFinished(false);
    setRunning(false);
    finishedRef.current = false;
    setRemaining(target * 60);
  }

  const progress = 1 - remaining / (target * 60);
  const deg = Math.round(Math.min(1, Math.max(0, progress)) * 360);

  return (
    <div>
      <h1 className="page-title">Grind</h1>
      <p className="page-sub">Diqqatni jamlang. 10, 25 yoki 50 daqiqalik sessiya tanlang.</p>

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
          className={`timer-ring ${finished ? "celebrate" : ""} ${running ? "timer-running-glow" : ""}`}
          style={{
            width: 240, height: 240, borderRadius: "50%", margin: "0 auto 24px",
            background: `conic-gradient(${running ? "var(--accent)" : finished ? "var(--green)" : "var(--accent)"} ${deg}deg, var(--line) 0deg)`,
            transition: "background 0.3s",
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
        {[
          { label: "Bugun",     val: stats ? fmt(stats.day)   : null },
          { label: "Shu hafta", val: stats ? fmt(stats.week)  : null },
          { label: "Shu oy",    val: stats ? fmt(stats.month) : null },
        ].map((s, i) => (
          <div key={s.label} className="card grind-stat" style={{ textAlign: "center", animationDelay: `${i * 80}ms` }}>
            {s.val ? (
              <div className="stat" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent2))", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent" }}>
                {s.val}
              </div>
            ) : (
              <div className="stat" style={{ color: "var(--muted)", fontSize: 28 }}>…</div>
            )}
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>So'nggi sessiyalar</h3>
        {stats && stats.recent.length === 0 && <p className="muted">Hali sessiya yo'q.</p>}
        {stats && stats.recent.map((s, i) => (
          <div key={i} className="todo session-row" style={{ marginBottom: 8, animationDelay: `${i * 55}ms` }}>
            <span style={{ fontSize: 20 }}>{s.completed ? "✅" : "⏹"}</span>
            <span className="todo-text">{fmt(s.minutes)} <span className="muted">/ {s.target} daq maqsad</span></span>
            <span className="muted" style={{ fontSize: 13 }}>{s.dateKey}</span>
          </div>
        ))}
        {stats && (
          <p className="muted" style={{ marginBottom: 0 }}>
            Jami: <b style={{ color: "var(--text)" }}>{fmt(stats.all)}</b> · {stats.count} sessiya
          </p>
        )}
      </div>
    </div>
  );
}
