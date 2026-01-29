import React from "react";

type Player = {
  id: string;
  name?: string;
  stage: number;
  color: string;
};

type Props = {
  players: Player[];
  winner?: any;
};

const PATH = [
  { x: 120, y: 120 },
  { x: 300, y: 120 },
  { x: 480, y: 120 },
  { x: 480, y: 280 },
  { x: 300, y: 280 },
  { x: 120, y: 280 },
  { x: 300, y: 440 },
  { x: 480, y: 440 },
  { x: 700, y: 280 }, // Escape Door
];

export const MazeBoard: React.FC<Props> = ({ players, winner }) => {
  return (
    <div className="relative w-full h-full bg-[#0b0b0b] overflow-hidden">

      {/* ================= ROOM BORDER ================= */}
      <div
        className="absolute border-4 border-yellow-500 rounded-2xl"
        style={{ left: 80, top: 80, width: 520, height: 520 }}
      />

      {/* ================= ESCAPE ROOM TITLE + LOGO ================= */}
      <div
        className="absolute flex items-center gap-3 px-4 py-2 
        bg-black/70 border border-yellow-400 rounded-full shadow-lg"
        style={{
          left: 200,
          top: 30,
        }}
      >
        <img
          src="/logo.png"
          alt="Escape Room"
          className="w-10 h-10"
        />
        <h1 className="text-yellow-300 font-extrabold text-xl tracking-wide">
          Escape Room
        </h1>
      </div>

      {/* ================= STAGES WITH LOCKS ================= */}
      {PATH.slice(0, 8).map((pos, i) => (
        <div
          key={i}
          className="absolute w-28 h-36 rounded-xl border-2 border-yellow-400
          bg-[#2b1b14] flex flex-col items-center justify-center
          shadow-lg"
          style={{ left: pos.x, top: pos.y }}
        >
          <div className="text-yellow-300 font-bold text-sm">
            Stage {i + 1}
          </div>

          {/* Lock Icon */}
          <div className="text-3xl mt-3">🔒</div>

          <p className="text-[10px] text-gray-300 mt-2">
          </p>
        </div>
      ))}

      {/* ================= ESCAPE DOOR (NO ANIMATION) ================= */}
      <div
        className="absolute w-40 h-48 rounded-xl border-4 border-green-400
        flex flex-col items-center justify-center
        bg-green-500/10 shadow-2xl"
        style={{ left: PATH[8].x, top: PATH[8].y }}
      >
        {/* Door Icon */}
        <div className="text-7xl">🚪</div>

        {/* Door Label */}
        <p className="mt-2 text-green-300 font-bold text-sm tracking-wide">
          Escaped!!
        </p>

        <p className="text-xs text-green-200">
          Winner Zone 👑
        </p>
      </div>

      {/* ================= PLAYERS ================= */}
      {players.map((p, idx) => {
        const pos = PATH[p.stage - 1] || PATH[0];

        return (
          <div
            key={p.id}
            className={`absolute w-10 h-10 rounded-full border-2 border-white
            flex items-center justify-center font-bold text-sm
            transition-all duration-700 ease-in-out ${p.color}`}
            style={{
              left: pos.x + 40 + idx * 15,
              top: pos.y + 70,
            }}
          >
            {p.name?.[0]}
          </div>
        );
      })}

      {/* ================= WINNER OVERLAY ================= */}
      {winner && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
          <div className="text-7xl animate-bounce">👑</div>

          <h1 className="text-4xl font-bold text-yellow-300 mt-3">
            {winner.name} Escaped!
          </h1>

          <p className="text-2xl text-white mt-2">
            Points: {winner.points}
          </p>

          <div className="text-6xl mt-6 animate-pulse">
            🎆🎉🎇
          </div>
        </div>
      )}
    </div>
  );
};