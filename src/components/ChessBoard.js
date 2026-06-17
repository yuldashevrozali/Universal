"use client";

import { useMemo, useState } from "react";
import { Chess } from "chess.js";

const GLYPH = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

// fen — joriy holat; orientation 'w'|'b'; canMove — yurish mumkinmi; onMove({from,to,promotion})
export default function ChessBoard({ fen, orientation = "w", canMove = false, onMove }) {
  const [selected, setSelected] = useState(null);

  const chess = useMemo(() => new Chess(fen), [fen]);
  const board = chess.board(); // [rank8..rank1][a..h]
  const turn = chess.turn();

  const legalTargets = useMemo(() => {
    if (!selected) return {};
    const map = {};
    for (const m of chess.moves({ square: selected, verbose: true })) map[m.to] = m;
    return map;
  }, [selected, chess]);

  function squareName(r, c) {
    return FILES[c] + (8 - r);
  }

  function handleClick(sq) {
    if (!canMove) return;
    const piece = chess.get(sq);
    if (selected) {
      if (legalTargets[sq]) {
        const mv = legalTargets[sq];
        const promotion = mv.promotion ? "q" : undefined; // avtomatik farzin
        setSelected(null);
        onMove?.({ from: selected, to: sq, promotion });
        return;
      }
      if (piece && piece.color === turn) { setSelected(sq); return; }
      setSelected(null);
      return;
    }
    if (piece && piece.color === turn) setSelected(sq);
  }

  // Orientatsiyaga qarab qatorlar/ustunlar tartibi
  const rows = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const cols = orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const lastCheck = chess.isCheck() ? turn : null;

  return (
    <div className="chess-board">
      {rows.map((r) =>
        cols.map((c) => {
          const sq = squareName(r, c);
          const cell = board[r][c];
          const dark = (r + c) % 2 === 1;
          const isSel = selected === sq;
          const isTarget = !!legalTargets[sq];
          const isCheckedKing = cell && cell.type === "k" && cell.color === lastCheck;
          return (
            <div
              key={sq}
              className={`sq ${dark ? "dark" : "light"} ${isSel ? "sel" : ""} ${isCheckedKing ? "check" : ""} ${canMove ? "clickable" : ""}`}
              onClick={() => handleClick(sq)}
            >
              {cell && <span className={`piece ${cell.color === "w" ? "wp-c" : "bp-c"}`}>{GLYPH[cell.color + cell.type]}</span>}
              {isTarget && <span className={`hint ${cell ? "cap" : ""}`} />}
            </div>
          );
        })
      )}
    </div>
  );
}
