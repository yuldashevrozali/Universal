"use client";

import { useEffect, useMemo, useState } from "react";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// cards: [{word, translation}]; onDone(correct) — javob berilgach chaqiriladi
export default function FlashcardGate({ cards, title = "Yurishdan oldin so'zni toping", onDone }) {
  const card = useMemo(() => cards[Math.floor(Math.random() * cards.length)], [cards]);
  const [picked, setPicked] = useState(null);

  const options = useMemo(() => {
    const others = shuffle(cards.filter((c) => c.translation !== card.translation)).slice(0, 3);
    return shuffle([card, ...others].map((c) => c.translation));
  }, [card, cards]);

  useEffect(() => { setPicked(null); }, [card]);

  function pick(opt) {
    if (picked) return;
    const correct = opt === card.translation;
    setPicked({ opt, correct });
    setTimeout(() => onDone?.(correct), 700);
  }

  return (
    <div className="modal-backdrop">
      <div className="modal sheet-up" style={{ maxWidth: 420 }}>
        <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>{title}</div>
        <div className="gate-word">{card.word}</div>
        <div className="gate-opts">
          {options.map((opt) => {
            let cls = "gate-opt";
            if (picked) {
              if (opt === card.translation) cls += " right";
              else if (opt === picked.opt) cls += " wrong";
            }
            return (
              <button key={opt} className={cls} onClick={() => pick(opt)} disabled={!!picked}>
                {opt}
              </button>
            );
          })}
        </div>
        {picked && (
          <div className={`gate-msg ${picked.correct ? "ok" : "bad"}`}>
            {picked.correct ? "✅ To'g'ri! Yuravering." : "❌ Xato — vaqtdan 10 soniya olib tashlanadi."}
          </div>
        )}
      </div>
    </div>
  );
}
