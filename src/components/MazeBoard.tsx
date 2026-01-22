import React from 'react';

type Player = {
  id: string;
  name?: string;
  stage: number; // 1 → 9
  color: string;
};

type Props = {
  players: Player[];
  winnerId?: string | null;
};

/**
 * 📍 PATH POSITIONS
 * 1–8 are INSIDE ROOM
 * 9 (Escaped) is OUTSIDE ROOM
 */
const PATH = [
  { x: 120, y: 120 },  // 1
  { x: 300, y: 120 },  // 2
  { x: 480, y: 120 },  // 3
  { x: 480, y: 280 },  // 4
  { x: 300, y: 280 },  // 5
  { x: 120, y: 280 },  // 6
  { x: 300, y: 440 },  // 7
  { x: 480, y: 440 },  // 8 (last inside room)
  { x: 700, y: 280 },  // 9 → ESCAPED (outside)
];

export const MazeBoard: React.FC<Props> = ({ players, winnerId }) => {
  return (
    <div className="relative w-full h-full bg-[#0b0b0b] overflow-hidden">

      {/* 🧱 ROOM WALL */}
      <div
        className="absolute border-4 border-amber-500 rounded-2xl bg-[#1a120d]"
        style={{
          left: 80,
          top: 80,
          width: 520,
          height: 520,
        }}
      >
        {/* ROOM LABEL */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 
          px-4 py-1 bg-black text-amber-400 border border-amber-400 rounded-full text-sm font-bold">
          Escape Room
        </div>
      </div>

      {/* 🧱 STAGES 1–8 (INSIDE ROOM) */}
      {PATH.slice(0, 8).map((pos, i) => {
        const stage = i + 1;

        return (
          <div
            key={stage}
            className="absolute w-28 h-36 rounded-xl border-4 
              border-amber-400 bg-[#3e2723]"
            style={{ left: pos.x, top: pos.y }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2
              px-3 py-1 text-xs font-bold bg-black text-amber-400
              border border-amber-400 rounded-full"
            >
              Stage {stage}
            </div>
          </div>
        );
      })}

      {/* 🚪 ESCAPED STAGE (OUTSIDE ROOM) */}
      <div
        className="absolute w-32 h-40 rounded-xl border-4
          border-green-400 bg-green-500/10"
        style={{
          left: PATH[8].x,
          top: PATH[8].y,
        }}
      >
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2
          px-3 py-1 text-xs font-bold bg-black text-green-400
          border border-green-400 rounded-full"
        >
          Escaped
        </div>

        <div className="absolute inset-0 flex items-center justify-center text-5xl animate-pulse">
          🚪
        </div>
      </div>

      {/* 🚶 PLAYERS */}
      {players.map((player, index) => {
        const pos = PATH[player.stage - 1] || PATH[0];

        return (
          <div
            key={player.id}
            className={`absolute w-10 h-10 rounded-full border-2 border-white
              flex items-center justify-center text-sm font-bold
              transition-all duration-700 ease-in-out
              ${player.color}
              ${winnerId === player.id ? 'animate-bounce scale-125' : ''}`}
            style={{
              left: pos.x + 45 + index * 18,
              top: pos.y + 95,
            }}
          >
            {player.name?.[0] || 'P'}
          </div>
        );
      })}
    </div>
  );
};
