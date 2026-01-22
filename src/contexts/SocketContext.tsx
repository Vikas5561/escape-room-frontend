import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { User, AllowedSubmissions } from '../types/types';

interface SocketContextType {
  socket: Socket | null;
  quizState: any | null;
  user: User | null;
  userId: string | null;
  currentRoomId: string | null;
  isConnected: boolean;
  joinRoom: (roomId: string, userName: string) => void;
  leaveRoom: () => void;
  submitAnswer: (
    roomId: string,
    problemId: string,
    optionSelected: AllowedSubmissions
  ) => void;
  createRoom: (userName: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [quizState, setQuizState] = useState<any | null>(null);
  const [user] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // ================= INIT =================
    newSocket.on('init', (data) => {
      if (data?.userId && data?.state) {
        setUserId(data.userId);
        setQuizState(data.state);
      } else {
        setQuizState({ type: 'not_started' });
      }
    });

    // ================= QUESTION =================
    newSocket.on('problem', (data) => {
      setQuizState((prev: any) => ({
        type: 'question',
        problem: data.problem,
        leaderboard: prev?.leaderboard || [],
      }));
    });

    // ================= LEADERBOARD =================
    newSocket.on('leaderboard', (data) => {
      setQuizState({
        type: 'leaderboard',
        leaderboard: data.leaderboard,
      });
    });

    // ================= QUIZ ENDED =================
    newSocket.on('ended', (data) => {
      setQuizState({
        type: 'ended',
        leaderboard: data.leaderboard,
      });
    });

    // 🔥🔥🔥 RESET EVENT (IMPORTANT FIX)
    newSocket.on('reset', () => {
      console.log('Quiz reset received from server');

      setQuizState({ type: 'not_started' });
      setUserId(null);
      setCurrentRoomId(null);
    });

    return () => {
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []);

  // ================= JOIN ROOM =================
  const joinRoom = (roomId: string, userName: string) => {
    if (!socket) return;

    socket.emit('join', { roomId, name: userName });
    setCurrentRoomId(roomId);
  };

  // ================= CREATE ROOM =================
  const createRoom = (userName: string) => {
    if (!socket) return;

    const roomId = Math.random().toString(36).substring(2, 10);
    socket.emit('join', { roomId, name: userName });
    setCurrentRoomId(roomId);
  };

  // ================= LEAVE ROOM =================
  const leaveRoom = () => {
    if (!socket || !currentRoomId) return;

    socket.emit('leave', { roomId: currentRoomId });

    setCurrentRoomId(null);
    setUserId(null);
    setQuizState(null);
  };

  // ================= SUBMIT ANSWER =================
  const submitAnswer = (
    roomId: string,
    problemId: string,
    optionSelected: AllowedSubmissions
  ) => {
    if (!socket || !userId) return;

    socket.emit('submit', {
      roomId,
      problemId,
      userId,
      submission: optionSelected,
    });
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
        leaveRoom,
        submitAnswer,
        createRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
