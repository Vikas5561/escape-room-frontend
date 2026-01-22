import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useSocket } from '../contexts/SocketContext';
import { MazeBoard } from './MazeBoard';
import type { AllowedSubmissions } from '../types/types';

export const Quiz = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { quizState, submitAnswer } = useSocket();

  const [selectedOption, setSelectedOption] = useState<AllowedSubmissions | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!roomId) navigate('/');
  }, [roomId]);

  useEffect(() => {
    if (quizState?.type !== 'question') return;

    setTimeLeft(30);
    setSubmitted(false);
    setSelectedOption(null);

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizState?.problem?.id]);

  // 🕒 WAITING SCREEN
  if (!quizState || quizState.type === 'not_started') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <Card className="p-8 text-center animate-pulse">
          <img src="/logo.png" className="mx-auto mb-4 w-20" />
          <h1 className="text-2xl font-bold text-white">Escape Room</h1>
          <p className="text-gray-400 mt-2">Waiting for admin to start…</p>
        </Card>
      </div>
    );
  }

  const leaderboard = quizState.leaderboard || [];

  const players = leaderboard.map((p: any, i: number) => ({
    id: p.id,
    name: p.name,
    stage: Math.min(Math.floor(p.points / 10) + 1, 9),
    color: i === 0 ? 'bg-blue-600' : 'bg-green-600',
  }));

  return (
    <div className="h-screen flex">

      {/* 🧩 GAMEBOARD – 58% */}
      <div className="w-[58%] bg-black">
        <MazeBoard players={players} />
      </div>

      {/* ❓ QUESTION + LEADERBOARD – 42% */}
      <div className="w-[42%] bg-white p-4 overflow-y-auto">
        {quizState.type === 'question' && (
          <>
            {/* QUESTION HEADER */}
            <Card className="mb-4">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Question</CardTitle>
                  <Badge>{timeLeft}s</Badge>
                </div>
                <Progress value={((30 - timeLeft) / 30) * 100} />
              </CardHeader>
            </Card>

            {/* QUESTION BODY */}
            <Card>
              <CardContent className="space-y-3">
                <h3 className="font-bold text-lg">
                  {quizState.problem.title}
                </h3>

                {quizState.problem.options.map((o: any) => (
                  <Button
                    key={o.id}
                    variant={selectedOption === o.id ? 'default' : 'outline'}
                    className="w-full"
                    disabled={submitted}
                    onClick={() => setSelectedOption(o.id)}
                  >
                    {o.title}
                  </Button>
                ))}

                <Button
                  className="w-full mt-4 active:scale-95 transition"
                  disabled={submitted || selectedOption === null}
                  onClick={() => {
                    submitAnswer(roomId!, quizState.problem.id, selectedOption!);
                    setSubmitted(true);
                  }}
                >
                  {submitted ? 'Submitted ✓' : 'Submit'}
                </Button>
              </CardContent>
            </Card>

            {/* 🏆 LEADERBOARD */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {leaderboard.map((p: any, i: number) => (
                  <div
                    key={p.id}
                    className="flex justify-between bg-gray-100 px-3 py-2 rounded"
                  >
                    <span>#{i + 1} {p.name}</span>
                    <span className="font-bold">{p.points}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
