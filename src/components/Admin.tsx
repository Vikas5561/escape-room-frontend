import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useSocket } from '../contexts/SocketContext';
import type { AllowedSubmissions } from '../types/types';

export const Admin = () => {

  const { socket, isConnected } = useSocket();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [currentQuizState, setCurrentQuizState] = useState<any>(null);
  const [activeQuizzes, setActiveQuizzes] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Problem creation form
  const [problemTitle, setProblemTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState<AllowedSubmissions>(0);

  // Listen for authentication events (always active)
  useEffect(() => {
    if (socket) {
      socket.on('adminAuth', (data) => {
        if (data.success) {
          setIsAuthenticated(true);
          setError('');
        } else {
          setError('Invalid admin password');
          setIsAuthenticated(false);
        }
      });

      return () => {
        socket.off('adminAuth');
      };
    }
  }, [socket]);

  // Listen for admin events (only when authenticated)
  useEffect(() => {
    if (socket && isAuthenticated) {
      socket.on('quizCreated', (data) => {
        setSuccess(`Quiz room "${data.roomId}" created successfully!`);
        setActiveQuizzes(prev => [...prev, data.roomId]);
        setTimeout(() => setSuccess(''), 3000);
      });

      socket.on('problemAdded', () => {
        setSuccess('Problem added successfully!');
        setProblemTitle('');
        setProblemDescription('');
        setOptions(['', '', '', '']);
        setCorrectAnswer(0);
        setTimeout(() => setSuccess(''), 3000);
      });

      socket.on('quizStateUpdate', (data) => {
        setCurrentQuizState(data);
      });

      socket.on('error', (data) => {
        setError(data.message);
        setTimeout(() => setError(''), 5000);
      });

      return () => {
        socket.off('quizCreated');
        socket.off('problemAdded');
        socket.off('quizStateUpdate');
        socket.off('error');
      };
    }
  }, [socket, isAuthenticated]);

  const handleLogin = () => {
    if (socket && password.trim()) {
      console.log('Attempting admin login with password:', password.trim());
      socket.emit('joinAdmin', { password: password.trim() });
      setError('');
      setSuccess('Authenticating...');
    } else if (!socket) {
      setError('Not connected to server');
    } else {
      setError('Please enter a password');
    }
  };

  const handleCreateQuiz = () => {
    if (socket && roomId.trim()) {
      socket.emit('createQuiz', { roomId: roomId.trim() });
      setError('');
    }
  };

  const handleCreateProblem = () => {
    if (socket && roomId.trim() && problemTitle.trim() && problemDescription.trim()) {
      const problem = {
        title: problemTitle.trim(),
        description: problemDescription.trim(),
        options: options.map((option, index) => ({
          id: index,
          title: option.trim()
        })).filter(option => option.title !== ''),
        answer: correctAnswer
      };

      if (problem.options.length < 2) {
        setError('Please provide at least 2 options');
        return;
      }

      socket.emit('createProblem', { roomId: roomId.trim(), problem });
      setError('');
    }
  };

  const handleNext = () => {
    if (socket && roomId.trim()) {
      socket.emit('next', { roomId: roomId.trim() });
      setError('');
    }
  };

  const handleStartQuiz = () => {
    if (socket && roomId.trim()) {
      socket.emit('start', { roomId: roomId.trim() });
      setError('');
    }
  };

  const handleGetQuizState = () => {
    if (socket && roomId.trim()) {
      socket.emit('getQuizState', { roomId: roomId.trim() });
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">Admin Login</CardTitle>
            <CardDescription>
              Enter admin password to access quiz management
            </CardDescription>
            <div className="flex items-center justify-center mt-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="ml-2 text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button
              onClick={handleLogin}
              className="w-full"
              disabled={!password.trim() || !isConnected}
            >
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Quiz Admin Panel
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardTitle>
            <CardDescription>Manage quizzes, problems, and control flow</CardDescription>
          </CardHeader>
        </Card>

        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="quiz" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quiz">Quiz Management</TabsTrigger>
            <TabsTrigger value="problems">Create Problems</TabsTrigger>
            <TabsTrigger value="control">Quiz Control</TabsTrigger>
            <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          </TabsList>

          {/* Remaining UI continues exactly same */}
        </Tabs>
      </div>
    </div>
  );
};
