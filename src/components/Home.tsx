import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSocket } from '../contexts/SocketContext';

export const Home = () => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const { joinRoom, isConnected } = useSocket();
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    joinRoom(roomId, userName);
    navigate(`/quiz/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-black flex items-center justify-center">
      <Card className="w-full max-w-md text-center p-6">
        <CardHeader>
          <img src="/logo.png" className="mx-auto w-24 mb-4" />
          <CardTitle className="text-2xl">Welcome in Escape Room</CardTitle>
          <CardDescription>
            Solve questions. Move stages. Escape the room 🚪
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Your Name</Label>
            <Input value={userName} onChange={e => setUserName(e.target.value)} />
          </div>

          <div>
            <Label>Room ID</Label>
            <Input value={roomId} onChange={e => setRoomId(e.target.value)} />
          </div>

          <Button
            className="w-full"
            disabled={!isConnected || !userName || !roomId}
            onClick={handleJoinRoom}
          >
            Join Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
