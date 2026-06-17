"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPage() {
  const [sets, setSets] = useState([]);
  const [game, setGame] = useState(null); // {cards, order, idx, score, picked}

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/flashcards");
      if (res.ok) setSets((await res.json()).sets);
    })();
  }, []);

  const startGame = useCallback(async (id) => {
    const res = await fetch(`/api/flashcards?id=${id}`);
    if (!res.ok) return;
    const { set } = await res.json();
    setGame({ name: set.name, cards: set.cards, order: shuffle(set.cards.map((_, i) => i)), idx: 0, score: 0, picked: null, done: false });
  }, []);

  const current = game ? game.cards[game.order[game.idx]] : null;

  const options = useMemo(() => {
    if (!current || !game) return [];
    const others = shuffle(game.cards.filter((c) => c.translation !== current.translation)).slice(0, 3);
    return shuffle([current, ...others].map((c) => c.translation));
  }, [current, game?.idx]); // eslint-disable-line

  function pick(opt) {
    if (game.picked) return;
    const correct = opt === current.translation;
    setGame((g) => ({ ...g, picked: { opt, correct }, score: g.score + (correct ? 1 : 0) }));
    setTimeout(() => {
      setGame((g) => {
        const next = g.idx + 1;
        if (next >= g.order.length) return { ...g, done: true };
        return { ...g, idx: next, picked: null };
      });
    }, 800);
  }

  // ---- Natija ----
  if (game?.done) {
    const pct = Math.round((game.score / game.order.length) * 100);
    return (
      <div>
        <h1 className="page-title">Natija</h1>
        <div className="card center" style={{ padding: 40 }}>
          <div className="quiz-result-emoji">{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "📚"}</div>
          <div className="stat" style={{ fontSize: 44 }}>{game.score} / {game.order.length}</div>
          <div className="muted">To'g'ri javoblar — {pct}%</div>
          <div className="row" style={{ justifyContent: "center", marginTop: 20 }}>
            <button className="btn auto" onClick={() => startGame(sets.find((s) => s.name === game.name)?.id)}>🔁 Qaytadan</button>
            <button className="btn secondary auto" onClick={() => setGame(null)}>Boshqa to'plam</button>
          </div>
        </div>
      </div>
    );
  }

  // ---- O'yin ----
  if (game && current) {
    return (
      <div>
        <div className="quiz-top">
          <button className="btn ghost auto" onClick={() => setGame(null)}>← Chiqish</button>
          <div className="quiz-progress">
            <div className="quiz-progress-fill" style={{ width: `${(game.idx / game.order.length) * 100}%` }} />
          </div>
          <div className="badge">{game.idx + 1}/{game.order.length}</div>
        </div>

        <div className="card center" style={{ padding: "36px 20px", marginBottom: 18 }}>
          <div className="muted" style={{ fontSize: 13 }}>Tarjimasini toping</div>
          <div className="quiz-word">{current.word}</div>
        </div>

        <div className="quiz-opts">
          {options.map((opt) => {
            let cls = "quiz-opt";
            if (game.picked) {
              if (opt === current.translation) cls += " right";
              else if (opt === game.picked.opt) cls += " wrong";
            }
            return (
              <button key={opt} className={cls} onClick={() => pick(opt)} disabled={!!game.picked}>{opt}</button>
            );
          })}
        </div>

        <div className="muted center" style={{ marginTop: 16 }}>Ball: <b style={{ color: "var(--green)" }}>{game.score}</b></div>
      </div>
    );
  }

  // ---- To'plam tanlash ----
  return (
    <div>
      <h1 className="page-title">Multiple choice</h1>
      <p className="page-sub">To'plamni tanlang — so'zning to'g'ri tarjimasini toping.</p>

      {sets.length === 0 && (
        <div className="card center" style={{ padding: 40 }}>
          <p className="muted" style={{ margin: 0 }}>Hali to'plam yo'q.{" "}
            <Link href="/dashboard/lessons/flashcards" style={{ color: "var(--accent)" }}>To'plam yarating →</Link>
          </p>
        </div>
      )}

      <div className="grid grid-2">
        {sets.map((s) => (
          <button key={s.id} className="card set-card" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => startGame(s.id)}>
            <h3 style={{ margin: "0 0 4px" }}>{s.name}</h3>
            <div className="muted" style={{ fontSize: 13 }}>{s.count} ta so'z · ▶ O'ynash</div>
          </button>
        ))}
      </div>
    </div>
  );
}
