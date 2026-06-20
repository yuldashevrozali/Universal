"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Chess } from "chess.js";
import Link from "next/link";
import ChessBoard from "@/components/ChessBoard";
import FlashcardGate from "@/components/FlashcardGate";

function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

const PIECE_VAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const DIFFICULTY_LEVELS = [
  { id: "beginner",     label: "Beginner",     emoji: "🐣", desc: "Tasodifiy yuradi, juda oson",       delay: 300,  errorRate: 0.55 },
  { id: "novice",       label: "Novice",        emoji: "🌱", desc: "Ba'zan yaxshi yurishlar qiladi",    delay: 450,  errorRate: 0.38 },
  { id: "elementary",   label: "Elementary",    emoji: "⚡", desc: "Donalarni himoya qilishga harakat", delay: 600,  errorRate: 0.25 },
  { id: "intermediate", label: "Intermediate",  emoji: "🧠", desc: "2 hamla oldini ko'radi",            delay: 800,  errorRate: 0.15 },
  { id: "advanced",     label: "Advanced",      emoji: "👑", desc: "3 hamla tahlil, kuchli raqib",      delay: 1000, errorRate: 0.06 },
];

// Positive = yaxshi qora (bot) uchun
function evaluate(chess) {
  if (chess.isCheckmate()) return chess.turn() === "b" ? -10000 : 10000;
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) return 0;
  let score = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      score += piece.color === "b" ? PIECE_VAL[piece.type] : -PIECE_VAL[piece.type];
    }
  }
  return score;
}

function minimax(chess, depth, alpha, beta, isMax) {
  if (depth === 0 || chess.isGameOver()) return evaluate(chess);
  const moves = chess.moves({ verbose: true });
  if (isMax) {
    let best = -Infinity;
    for (const m of moves) {
      chess.move(m);
      const val = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      chess.move(m);
      const val = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function botMoveForLevel(chess, levelId) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  if (levelId === "beginner") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  if (levelId === "novice") {
    let best = [], bestScore = -Infinity;
    for (const m of moves) {
      let score = Math.random() * 3;
      if (m.captured) score += PIECE_VAL[m.captured];
      if (score > bestScore) { bestScore = score; best = [m]; }
      else if (score === bestScore) best.push(m);
    }
    return best[Math.floor(Math.random() * best.length)];
  }

  if (levelId === "elementary") {
    let best = [], bestScore = -Infinity;
    for (const m of moves) {
      let score = Math.random() * 0.5;
      if (m.captured) score += PIECE_VAL[m.captured] * 2;
      const test = new Chess(chess.fen());
      test.move(m);
      if (test.isCheckmate()) score += 1000;
      else if (test.isCheck()) score += 0.6;
      if (score > bestScore) { bestScore = score; best = [m]; }
      else if (score === bestScore) best.push(m);
    }
    return best[Math.floor(Math.random() * best.length)];
  }

  // intermediate: depth 2 | advanced: depth 3
  const depth = levelId === "advanced" ? 3 : 2;
  const clone = new Chess(chess.fen());
  let bestMove = null, bestScore = -Infinity;
  for (const m of moves) {
    clone.move(m);
    const score = minimax(clone, depth - 1, -Infinity, Infinity, false);
    clone.undo();
    if (score > bestScore) { bestScore = score; bestMove = m; }
  }
  return bestMove || moves[0];
}

export default function ChessSetupPage() {
  const router = useRouter();
  const [sets, setSets] = useState([]);
  const [setId, setSetId] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [difficulty, setDifficulty] = useState("elementary");
  const [mode, setMode] = useState(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/flashcards");
      if (res.ok) setSets((await res.json()).sets);
    })();
  }, []);

  const chosenSet = sets.find((s) => s.id === setId);
  const chosenLvl = DIFFICULTY_LEVELS.find((d) => d.id === difficulty);

  async function playPartner() {
    setErr(""); setCreating(true);
    const res = await fetch("/api/chess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ setId: setId || null, minutes }),
    });
    setCreating(false);
    const d = await res.json();
    if (!res.ok) { setErr(d.error || "Xatolik"); return; }
    router.push(`/dashboard/lessons/chess/${d.code}`);
  }

  if (mode === "bot") {
    return <BotGame setId={setId} minutes={minutes} difficulty={difficulty} sets={sets} onExit={() => setMode(null)} />;
  }

  return (
    <div>
      <h1 className="page-title">Shaxmat</h1>
      <p className="page-sub">Har yurishdan oldin tanlangan to'plamdan tasodifiy so'z chiqadi. Xato javob — vaqtdan 10 soniya.</p>

      {err && <div className="error">{err}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>1. So'z to'plamini tanlang</h3>
        {sets.length === 0 && (
          <p className="muted">Hali to'plam yo'q.{" "}
            <Link href="/dashboard/lessons/flashcards" style={{ color: "var(--accent)" }}>Yarating →</Link>{" "}
            (yoki to'plamsiz o'ynashingiz mumkin)
          </p>
        )}
        <div className="row">
          <button className={`pill ${setId === "" ? "active" : ""}`} onClick={() => setSetId("")}>So'zsiz</button>
          {sets.map((s) => (
            <button key={s.id} className={`pill ${setId === s.id ? "active" : ""}`} onClick={() => setSetId(s.id)}>
              {s.name} ({s.count})
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>2. Vaqt</h3>
        <div className="row">
          {[3, 5, 10].map((m) => (
            <button key={m} className={`pill ${minutes === m ? "active" : ""}`} onClick={() => setMinutes(m)}>{m} daqiqa</button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>3. Bot darajasi</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {DIFFICULTY_LEVELS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${difficulty === d.id ? "var(--accent)" : "var(--line)"}`,
                background: difficulty === d.id ? "var(--card2)" : "var(--bg2)",
                color: "var(--text)",
                textAlign: "left",
                cursor: "pointer",
                transition: "border-color .15s, background .15s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{d.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{d.label}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{d.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>4. Raqib</h3>
        <div className="grid grid-2">
          <button className="choose-card" onClick={() => setMode("bot")}>
            <span className="choose-ic">🤖</span>
            <b>Bot bilan</b>
            <span className="muted" style={{ fontSize: 12 }}>{chosenLvl?.emoji} {chosenLvl?.label}</span>
          </button>
          <button className="choose-card" onClick={playPartner} disabled={creating}>
            <span className="choose-ic">👥</span>
            <b>Sherik bilan</b>
            <span className="muted" style={{ fontSize: 12 }}>{creating ? "Yaratilmoqda…" : "Link ulashasiz"}</span>
          </button>
        </div>
        {chosenSet && <p className="muted" style={{ marginBottom: 0, marginTop: 14 }}>Tanlangan to'plam: <b>{chosenSet.name}</b></p>}
      </div>
    </div>
  );
}

/* ============ BOT BILAN O'YIN (mahalliy) ============ */
function BotGame({ setId, minutes, difficulty, sets, onExit }) {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [cards, setCards] = useState(null);
  const [myMs, setMyMs] = useState(minutes * 60 * 1000);
  const [botMs, setBotMs] = useState(minutes * 60 * 1000);
  const [gatePassed, setGatePassed] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [status, setStatus] = useState("active");
  const [thinking, setThinking] = useState(false);

  const turn = gameRef.current.turn();
  const useGate = setId && cards && cards.length >= 4;
  const lvl = DIFFICULTY_LEVELS.find((d) => d.id === difficulty) || DIFFICULTY_LEVELS[2];

  useEffect(() => {
    if (!setId) return;
    (async () => {
      const res = await fetch(`/api/flashcards?id=${setId}`);
      if (res.ok) setCards((await res.json()).set.cards);
    })();
  }, [setId]);

  useEffect(() => {
    if (status !== "active") return;
    const iv = setInterval(() => {
      if (gameRef.current.turn() === "w") {
        setMyMs((t) => { if (t <= 1000) { finish("lose"); return 0; } return t - 1000; });
      } else {
        setBotMs((t) => { if (t <= 1000) { finish("win"); return 0; } return t - 1000; });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [status]);

  function finish(r) { setStatus(r); }

  function checkEnd() {
    const g = gameRef.current;
    if (g.isCheckmate()) { finish(g.turn() === "w" ? "lose" : "win"); return true; }
    if (g.isDraw() || g.isStalemate() || g.isThreefoldRepetition()) { finish("draw"); return true; }
    return false;
  }

  const doBot = useCallback(() => {
    const g = gameRef.current;
    if (g.turn() !== "b" || g.isGameOver()) return;
    const level = DIFFICULTY_LEVELS.find((d) => d.id === difficulty) || DIFFICULTY_LEVELS[2];
    setThinking(true);
    setTimeout(() => {
      const m = botMoveForLevel(g, difficulty);
      if (m) {
        g.move(m);
        if (useGate && Math.random() < level.errorRate) setBotMs((t) => Math.max(0, t - 10000));
        setFen(g.fen());
      }
      setThinking(false);
      checkEnd();
    }, level.delay);
  }, [useGate, difficulty]);

  function onMove({ from, to, promotion }) {
    const g = gameRef.current;
    let mv;
    try { mv = g.move({ from, to, promotion: promotion || "q" }); } catch { mv = null; }
    if (!mv) return;
    if (wrong) setMyMs((t) => Math.max(0, t - 10000));
    setWrong(false);
    setGatePassed(false);
    setFen(g.fen());
    if (!checkEnd()) doBot();
  }

  function onGate(correct) {
    setWrong(!correct);
    setGatePassed(true);
  }

  const canMove = status === "active" && turn === "w" && !thinking && (!useGate || gatePassed);
  const showGate = status === "active" && turn === "w" && useGate && !gatePassed && !thinking;

  const resultText = { win: "🏆 Yutdingiz!", lose: "😔 Yutqazdingiz", draw: "🤝 Durrang" };

  return (
    <div>
      <button className="btn ghost auto" onClick={onExit} style={{ marginBottom: 16 }}>← Sozlamalar</button>
      <h1 className="page-title">🤖 Bot bilan &mdash; {lvl.emoji} {lvl.label}</h1>

      <div className="chess-layout">
        <div className="clock-row">
          <div className={`clock ${turn === "b" ? "on" : ""}`}>🤖 Bot <b>{fmtClock(botMs)}</b></div>
        </div>

        <ChessBoard fen={fen} orientation="w" canMove={canMove} onMove={onMove} />

        <div className="clock-row">
          <div className={`clock ${turn === "w" ? "on" : ""}`}>👤 Siz (oq) <b>{fmtClock(myMs)}</b></div>
        </div>

        {status === "active" ? (
          <p className="muted center" style={{ marginTop: 12 }}>
            {turn === "w"
              ? (showGate ? "So'zga javob bering…" : thinking ? "Bot o'ylayapti…" : "Sizning navbatingiz — yuring")
              : "Bot o'ylayapti…"}
          </p>
        ) : (
          <div className="card center" style={{ marginTop: 16 }}>
            <div style={{ fontSize: 40 }}>{resultText[status].split(" ")[0]}</div>
            <h3 style={{ margin: "6px 0 14px" }}>{resultText[status]}</h3>
            <button className="btn auto" onClick={onExit}>Yana o'ynash</button>
          </div>
        )}
      </div>

      {showGate && <FlashcardGate cards={cards} onDone={onGate} />}
    </div>
  );
}
