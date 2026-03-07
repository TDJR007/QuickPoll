import { useState, type SetStateAction } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon } from 'lucide-react';

interface PollResponse {
  id: string;
  question: string;
  options: { id: string; text: string }[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const { isDark, toggle } = useThemeStore();

  const { mutate: logout } = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });

  // 📌 Logout now hits the backend to clear the cookie server-side.
  // You can't clear an httpOnly cookie from JavaScript — that's the whole point of httpOnly.
  // Only the server that set it can clear it.

  const { mutate: createPoll, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<PollResponse>('/polls', {
        question,
        options: options.filter((o) => o.trim() !== ''),
      });
      return res.data;
    },
    onSuccess: (data) => {
      navigate(`/poll/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Something went wrong');
    },
  });

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length < 10) setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">QuickPoll</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
            <Button variant="outline" size="sm" onClick={toggle}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a Poll</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={question}
                onChange={(e: { target: { value: SetStateAction<string>; }; }) => setQuestion(e.target.value)}
                placeholder="What do you want to ask?"
              />
            </div>
            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e: { target: { value: string; }; }) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={addOption}
              disabled={options.length >= 10}
              className="w-full"
            >
              + Add Option
            </Button>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => createPoll()}
              disabled={isPending}
            >
              {isPending ? 'Creating...' : 'Create Poll'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

/*
    📌 A few React patterns worth noting here. 
    options is an array in state — when you update one option you can't mutate the array directly,
    you spread it into a new array first ([...options]) and then update the copy.
    React needs a new reference to detect the change and re-render.
    Mutating state directly is one of the most common React bugs, remember this one. 
    Also notice we filter empty options before sending to the backend — client side cleanup before the request.
*/