import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { User, AllowedSubmissions } from "../types/types";

interface SocketContextType {
  socket: Socket | null;
  quizState: any | null;
  user: User | null;
  userId: string | null;
  currentRoomId: string | null;
  isConnected: boolean;

  joinRoom: (
    roomId: string,
    userName: string,
    onSuccess: () => void
  ) => void;

  submitAnswer: (
    roomId: string,
    problemId: string,
    optionSelected: AllowedSubmissions
  ) => void;

  leaveRoom: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside provider");
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const [quizState, setQuizState] = useState<any>({
    type: "not_started",
  });

  const [user] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  // ================= SOCKET INIT =================
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    setSocket(newSocket);

    // ✅ Connection Status
    newSocket.on("connect", () => setIsConnected(true));
    newSocket.on("disconnect", () => setIsConnected(false));

    // ====================================================
    // ✅ FORCE REJOIN EVENT (Admin Restart/Delete)
    // ====================================================
    newSocket.on("forceRejoin", () => {
      console.log("⚠ Room restarted by Admin. Sending user back...");

      // Clear everything
      setUserId(null);
      setCurrentRoomId(null);
      setQuizState({ type: "not_started" });

      // Redirect user back to Join page
      window.location.href = "/";
    });

    // ====================================================
    // ✅ QUESTION EVENT
    // ====================================================
    newSocket.on("problem", (data) => {
      setQuizState((prev: any) => ({
        ...prev,
        type: "question",
        problem: data.problem,
      }));
    });

    // ====================================================
    // ✅ LEADERBOARD EVENT
    // ====================================================
    newSocket.on("leaderboard", (data) => {
      setQuizState({
        type: "leaderboard",
        leaderboard: data.leaderboard,
        winner: data.winner || null,
      });
    });

    // ====================================================
    // ✅ WINNER EVENT
    // ====================================================
    newSocket.on("winner", (data) => {
      setQuizState({
        type: "ended",
        leaderboard: data.leaderboard,
        winner: data.winner,
      });
    });

    // ====================================================
    // ✅ QUIZ ENDED EVENT
    // ====================================================
    newSocket.on("ended", (data) => {
      setQuizState({
        type: "ended",
        leaderboard: data.leaderboard,
        winner: data.winner || null,
      });
    });

    // ====================================================
    // ✅ RESET EVENT (Room Deleted)
    // ====================================================
    newSocket.on("reset", () => {
      console.log("Room reset received!");

      setUserId(null);
      setCurrentRoomId(null);
      setQuizState({ type: "not_started" });
    });

    // Cleanup
    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []);

  // ================= JOIN ROOM =================
  const joinRoom = (
    roomId: string,
    userName: string,
    onSuccess: () => void
  ) => {
    if (!socket) return;

    socket.emit("join", { roomId, name: userName });

    socket.once("init", (data) => {
      setUserId(data.userId);
      setQuizState(data.state);
      setCurrentRoomId(roomId);

      onSuccess();
    });
  };

  // ================= SUBMIT ANSWER =================
  const submitAnswer = (
    roomId: string,
    problemId: string,
    optionSelected: AllowedSubmissions
  ) => {
    if (!socket || !userId) return;

    socket.emit("submit", {
      roomId,
      problemId,
      userId,
      submission: optionSelected,
    });
  };

  // ================= LEAVE ROOM =================
  const leaveRoom = () => {
    setUserId(null);
    setCurrentRoomId(null);
    setQuizState({ type: "not_started" });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        quizState,
        user,
        userId,
        currentRoomId,
        isConnected,
        joinRoom,
        submitAnswer,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};