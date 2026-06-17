"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ChessBoard from "@/components/ChessBoard";
import FlashcardGate from "@/components/FlashcardGate";

function fmtClock(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function PartnerChessPage() {
  const { code } = useParams();
  const [game, setGame] = useState(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  // Flashcard gate holati (yurish oldidan)
  const [gatePassed, setGatePassed] = useState(false);
  const [wrong, setWrong] = useState(false);
  const lastTurnRef = useRef(null);

  // Jonli soat uchun (har soniya yangilanadi)
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/chess/${code}`);
    if (res.ok) setGame((await res.json()).game);
  }, [code]);

  // Boshlanishida qo'shilish (host bo'lsa ham xavfsiz)
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/chess/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error || "Xatolik"); return; }
      setGame(d.game);
    })();
  }, [code]);

  // Polling
  useEffect(() => {
    const iv = setInterval(refresh, 2000);
    return () => clearInterval(iv);
  }, [refresh]);

  // Navbat o'zgarganda gate'ni qayta tiklash
  useEffect(() => {
    if (!game) return;
    if (lastTurnRef.current !== game.turn) {
      lastTurnRef.current = game.turn;
      setGatePassed(false);
      setWrong(false);
    }
  }, [game?.turn]); // eslint-disable-line

  async function onMove({ from, to, promotion }) {
    const res = await fetch(`/api/chess/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "move", from, to, promotion, wrongAnswer: wrong }),
    });
    const d = await res.json();
    if (res.ok) { setGame(d.game); setGatePassed(false); setWrong(false); }
  }

  async function resign() {
    const res = await fetch(`/api/chess/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resign" }),
    });
    if (res.ok) setGame((await res.json()).game);
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (err) return <div className="error" style={{ maxWidth: 480 }}>{err}</div>;
  if (!game) return <p className="muted">Yuklanmoqda…</p>;

  const myColor = game.youColor;
  const useGate = game.cards && game.cards.length >= 4;
  const isMyTurn = game.status === "active" && game.turn === myColor;
  const showGate = isMyTurn && useGate && !gatePassed;
  const canMove = isMyTurn && (!useGate || gatePassed);

  // Raqib / o'zim ma'lumotlari
  const meIsHost = game.youAreHost;
  const myName = meIsHost ? game.host.name : game.guest?.name;
  const oppName = meIsHost ? game.guest?.name : game.host.name;
  const oppColor = myColor === "w" ? "b" : "w";

  // Jonli soat: navbatdagi o'yinchining vaqti real vaqtda kamayadi
  const elapsed = game.status === "active" ? Math.max(0, now - new Date(game.lastMoveAt).getTime()) : 0;
  const hostLive = game.turn === game.host.color ? game.hostTimeMs - elapsed : game.hostTimeMs;
  const guestLive = game.guest && game.turn === game.guest.color ? game.guestTimeMs - elapsed : game.guestTimeMs;
  const myMs = meIsHost ? hostLive : guestLive;
  const oppMs = meIsHost ? guestLive : hostLive;

  // Natija matni
  let banner = null;
  if (game.status === "waiting") {
    banner = (
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Sherikni kuting 👥</h3>
        <p className="muted">Quyidagi havolani sherigingizga yuboring. U ro'yxatdan o'tib (yoki kirib) shu havolaga kirsa, o'yin boshlanadi.</p>
        <div className="row">
          <input readOnly value={typeof window !== "undefined" ? window.location.href : ""} onClick={(e) => e.target.select()} />
          <button className="btn auto" onClick={copyLink}>{copied ? "✓ Nusxalandi" : "Nusxalash"}</button>
        </div>
        {game.setName && <p className="muted" style={{ marginBottom: 0 }}>To'plam: <b>{game.setName}</b></p>}
      </div>
    );
  } else if (game.status === "finished") {
    const iWon = (game.result === "host" && meIsHost) || (game.result === "guest" && !meIsHost);
    const txt = game.result === "draw" ? "🤝 Durrang" : iWon ? "🏆 Yutdingiz!" : "😔 Yutqazdingiz";
    banner = (
      <div className="card center" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 40 }}>{txt.split(" ")[0]}</div>
        <h3 style={{ margin: "6px 0" }}>{txt}</h3>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">♟️ Shaxmat — sherik bilan</h1>
      <p className="page-sub">
        Siz: <b>{myName || "Siz"}</b> ({myColor === "w" ? "oq" : "qora"}) · Raqib: <b>{oppName || "—"}</b>
        {game.setName ? <> · To'plam: <b>{game.setName}</b></> : null}
      </p>

      {banner}

      <div className="chess-layout">
        <div className="clock-row">
          <div className={`clock ${game.turn === oppColor ? "on" : ""}`}>
            {oppColor === "w" ? "♔" : "♚"} {oppName || "Raqib"} <b>{fmtClock(oppMs)}</b>
          </div>
        </div>

        <ChessBoard fen={game.fen} orientation={myColor || "w"} canMove={canMove} onMove={onMove} />

        <div className="clock-row">
          <div className={`clock ${game.turn === myColor ? "on" : ""}`}>
            {myColor === "w" ? "♔" : "♚"} {myName || "Siz"} <b>{fmtClock(myMs)}</b>
          </div>
        </div>

        {game.status === "active" && (
          <p className="muted center" style={{ marginTop: 12 }}>
            {isMyTurn ? (showGate ? "So'zga javob bering…" : "Sizning navbatingiz — yuring") : "Raqib o'ylayapti…"}
          </p>
        )}

        {game.status === "active" && (
          <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
            <button className="btn danger auto" onClick={resign}>Taslim bo'lish</button>
          </div>
        )}
      </div>

      {showGate && <FlashcardGate cards={game.cards} onDone={(c) => { setWrong(!c); setGatePassed(true); }} />}
    </div>
  );
}
