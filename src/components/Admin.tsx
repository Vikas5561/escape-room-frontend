import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription } from "./ui/alert";
import { useSocket } from "../contexts/SocketContext";
import type { AllowedSubmissions } from "../types/types";

export const Admin = () => {
  const { socket, isConnected } = useSocket();

  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [roomId, setRoomId] = useState("");
  const [currentQuizState, setCurrentQuizState] = useState<any>(null);

  const [dbRooms, setDbRooms] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Problem creation form
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] =
    useState<AllowedSubmissions>(0);

  // ================= ADMIN AUTH =================
  useEffect(() => {
    if (!socket) return;

    socket.on("adminAuth", (data) => {
      if (data.success) {
        setIsAuthenticated(true);
        setSuccess("Admin Logged In Successfully!");

        // ✅ Load Rooms from MongoDB immediately
        socket.emit("getRooms");
      } else {
        setError("Invalid admin password");
        setIsAuthenticated(false);
      }
    });

    return () => {
      socket.off("adminAuth");
    };
  }, [socket]);

  // ================= ADMIN EVENTS =================
  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    // ✅ Rooms List from DB
    socket.on("roomsList", (rooms) => {
      const ids = rooms.map((r: any) => r.roomId);
      setDbRooms(ids);
    });

    // ✅ Restart Confirmation
    socket.on("roomRestarted", (data) => {
      setSuccess(`Room Restarted: ${data.roomId}`);
      setTimeout(() => setSuccess(""), 3000);
    });

    socket.on("quizCreated", (data) => {
      setSuccess(`Quiz room "${data.roomId}" created successfully!`);

      // Reload rooms list
      socket.emit("getRooms");

      setTimeout(() => setSuccess(""), 3000);
    });

    socket.on("problemAdded", () => {
      setSuccess("Problem added successfully!");
      setProblemTitle("");
      setProblemDescription("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setTimeout(() => setSuccess(""), 3000);
    });

    socket.on("quizStateUpdate", (data) => {
      setCurrentQuizState(data);
    });

    socket.on("error", (data) => {
      setError(data.message);
      setTimeout(() => setError(""), 5000);
    });

    return () => {
      socket.off("roomsList");
      socket.off("roomRestarted");
      socket.off("quizCreated");
      socket.off("problemAdded");
      socket.off("quizStateUpdate");
      socket.off("error");
    };
  }, [socket, isAuthenticated]);

  // ================= LOGIN =================
  const handleLogin = () => {
    if (!socket) return;
    socket.emit("joinAdmin", { password });
  };

  // ================= CREATE QUIZ =================
  const handleCreateQuiz = () => {
    if (!socket || !roomId.trim()) return;
    socket.emit("createQuiz", { roomId });
  };

  // ================= RESTART ROOM =================
  const handleRestartRoom = (id: string) => {
    if (!socket) return;
    socket.emit("restartRoom", { roomId: id });
  };

  // ================= DELETE ROOM =================
  const handleDeleteRoom = (id: string) => {
    if (!socket) return;

    if (
      window.confirm(
        `Are you sure you want to DELETE room "${id}" permanently?`
      )
    ) {
      socket.emit("endQuiz", { roomId: id });

      setSuccess(`Room Deleted Successfully: ${id}`);

      // Refresh rooms list again
      socket.emit("getRooms");
    }
  };

  // ================= ADD QUESTION =================
  const handleCreateProblem = () => {
    if (!socket || !roomId.trim()) return;

    const problem = {
      title: problemTitle,
      description: problemDescription,
      options: options.map((o, i) => ({
        id: i,
        title: o,
      })),
      answer: correctAnswer,
    };

    socket.emit("createProblem", { roomId, problem });
  };

  // ================= START QUIZ =================
  const handleStartQuiz = () => {
    if (!socket) return;
    socket.emit("start", { roomId });
  };

  // ================= NEXT =================
  const handleNext = () => {
    if (!socket) return;
    socket.emit("next", { roomId });
  };

  // ================= GET STATE =================
  const handleGetQuizState = () => {
    if (!socket) return;
    socket.emit("getQuizState", { roomId });
  };

  // ================= UI LOGIN =================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <Card className="w-[400px] p-6">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>
              Server Status:{" "}
              <span className="font-bold">
                {isConnected ? "Connected ✅" : "Disconnected ❌"}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="Enter Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button className="w-full" onClick={handleLogin}>
              Login
            </Button>

            {error && <p className="text-red-500">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ================= MAIN ADMIN PANEL =================
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Escape Room Quiz Admin Panel</CardTitle>
          <CardDescription>
            Manage quiz rooms, restart, delete, and control flow
          </CardDescription>
        </CardHeader>
      </Card>

      {success && (
        <Alert className="mb-4 bg-green-100">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4 bg-red-100">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="rooms">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="quiz">Create Quiz</TabsTrigger>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="control">Control</TabsTrigger>
        </TabsList>

        {/* ================= ROOMS TAB ================= */}
        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Saved Quiz Rooms (MongoDB)</CardTitle>
              <CardDescription>
                Select, Restart, or Delete any room anytime
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              {dbRooms.length === 0 ? (
                <p>No rooms found.</p>
              ) : (
                dbRooms.map((r) => (
                  <div
                    key={r}
                    className="flex justify-between items-center border p-3 rounded-lg bg-white shadow-sm"
                  >
                    <span className="font-bold text-lg">{r}</span>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRoomId(r)}
                      >
                        Select
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRestartRoom(r)}
                      >
                        Restart
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteRoom(r)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= CREATE QUIZ ================= */}
        <TabsContent value="quiz">
          <Card>
            <CardHeader>
              <CardTitle>Create New Quiz Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />

              <Button onClick={handleCreateQuiz}>Create Room</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= PROBLEMS ================= */}
        <TabsContent value="problems">
          <Card>
            <CardHeader>
              <CardTitle>Add Problem</CardTitle>
              <CardDescription>
                Adding question to Room:{" "}
                <span className="font-bold">{roomId}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              <Input
                placeholder="Problem Title"
                value={problemTitle}
                onChange={(e) => setProblemTitle(e.target.value)}
              />

              <Input
                placeholder="Description"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
              />

              <Button onClick={handleCreateProblem}>Add Question</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= CONTROL ================= */}
        <TabsContent value="control">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Controls</CardTitle>
              <CardDescription>
                Current Room:{" "}
                <span className="font-bold">{roomId}</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              <Button onClick={handleStartQuiz}>Start Quiz</Button>

              <Button onClick={handleNext} variant="outline">
                Next Question
              </Button>

              <Button onClick={handleGetQuizState} variant="secondary">
                Refresh State
              </Button>

              {currentQuizState && (
                <pre className="bg-black text-green-400 p-2 rounded mt-4 text-xs">
                  {JSON.stringify(currentQuizState, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
