import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { useSocket } from "../contexts/SocketContext";
import { MazeBoard } from "./MazeBoard";
import type { AllowedSubmissions } from "../types/types";

export const Quiz = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { quizState, submitAnswer } = useSocket();

  const [selectedOption, setSelectedOption] =
    useState<AllowedSubmissions | null>(null);

  const [timeLeft, setTimeLeft] = useState(15);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!roomId) navigate("/");
  }, [roomId]);

  // TIMER ONLY DURING QUESTION
  useEffect(() => {
    if (quizState?.type !== "question") return;

    setTimeLeft(15);
    setSubmitted(false);
    setSelectedOption(null);

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState?.problem?.id]);

  // ✅ UPDATED WAITING SCREEN UI
  if (!quizState || quizState.type === "not_started") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black text-white">

        {/* Logo */}
        <img
          src="/logo.png"
          alt="Escape Room"
          className="w-28 mb-6 animate-pulse"
        />

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-yellow-400 tracking-wide">
          Escape Room Quiz
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-lg text-gray-300">
          Waiting for Admin to Start the Game...
        </p>

        {/* Loader Animation */}
        <div className="mt-8 flex space-x-3">
          <span className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></span>
          <span className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce delay-150"></span>
          <span className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce delay-300"></span>
        </div>

        {/* Hint */}
        <p className="mt-8 text-sm text-gray-500 italic">
          Solve questions → Unlock stages → Escape 🚪
        </p>
      </div>
    );
  }

  const leaderboard = quizState.leaderboard || [];

  const players = leaderboard.map((p: any, i: number) => ({
    id: p.id,
    name: p.name,
    stage: Math.min(Math.floor(p.points / 10) + 1, 9),
    color: i === 0 ? "bg-blue-600" : "bg-green-600",
  }));

  return (
    <div className="h-screen flex">

      {/* GAMEBOARD */}
      <div className="w-[58%] bg-black">
        <MazeBoard players={players} winner={quizState.winner} />
      </div>

      {/* RIGHT PANEL */}
      <div className="w-[42%] bg-white p-4 overflow-y-auto">

        {/* QUESTION */}
        {quizState.type === "question" && (
          <>
            <Card className="mb-4">
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Question</CardTitle>
                  <Badge>{timeLeft}s</Badge>
                </div>
                <Progress value={(timeLeft / 15) * 100} />
              </CardHeader>
            </Card>

            <Card>
              <CardContent className="space-y-3">
                <h2 className="font-bold text-lg">
                  {quizState.problem.title}
                </h2>

                {quizState.problem.options.map((o: any) => (
                  <Button
                    key={o.id}
                    className="w-full"
                    variant={selectedOption === o.id ? "default" : "outline"}
                    disabled={submitted}
                    onClick={() => setSelectedOption(o.id)}
                  >
                    {o.title}
                  </Button>
                ))}

                <Button
                  className="w-full mt-3"
                  disabled={submitted || selectedOption === null}
                  onClick={() => {
                    submitAnswer(roomId!, quizState.problem.id, selectedOption!);
                    setSubmitted(true);
                  }}
                >
                  {submitted ? "Submitted ✓" : "Submit"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* LEADERBOARD */}
        {quizState.type === "leaderboard" && (
          <Card>
            <CardHeader>
              <CardTitle>🏆 Leaderboard</CardTitle>
              <p className="text-sm text-gray-500">
                Wait for next Question...
              </p>
            </CardHeader>

            <CardContent>
              {leaderboard.map((p: any, i: number) => (
                <div
                  key={p.id}
                  className="flex justify-between p-2 border-b"
                >
                  <span>
                    #{i + 1} {p.name}
                  </span>
                  <span className="font-bold">{p.points}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* WINNER SCREEN */}
        {quizState.type === "ended" && quizState.winner && (
          <h1 className="text-3xl font-bold text-center text-green-600 mt-10">
            🎉 Winner: {quizState.winner.name}
          </h1>
        )}
      </div>
    </div>
  );
};
