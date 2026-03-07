import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';

interface AuthResponse {
  user: { id: string; email: string; createdAt: string };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { mutate: login, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Something went wrong');
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to QuickPoll</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => login()}
            disabled={isPending}
          >
            {isPending ? 'Logging in...' : 'Login'}
          </Button>
          <p className="text-sm text-muted-foreground">
            No account?{' '}
            <Link to="/register" className="underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

/*
    📌 useMutation from Tanstack Query is for any request that changes data (POST, PUT, DELETE). 
    It gives you mutate to trigger it, isPending to show loading state, onSuccess and onError callbacks. 
    useQuery is for fetching data. 
    That's the Tanstack boundary — mutations change things, queries fetch things.
*/