import { useState, type SetStateAction } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Check, X } from 'lucide-react';

interface AuthResponse {
  user: { id: string; email: string; createdAt: string };
}

const rules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const { mutate: register, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post<AuthResponse>('/auth/register', { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user);
      navigate('/dashboard');
    },
    onError: (err: any) => {
      const fields = err.response?.data?.fields;
      if (fields?.password) {
        setError(fields.password[0]);
      } else if (fields?.email) {
        setError(fields.email[0]);
      } else {
        setError(err.response?.data?.error ?? 'Something went wrong');
      }
    },
  });

  const allValid = rules.every(r => r.test(password));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <p className="text-sm text-muted-foreground pt-1">
            QuickPoll — Create polls, share them, and see live results.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e: { target: { value: SetStateAction<string> } }) => {
                setPassword(e.target.value);
                setTouched(true);
              }}
              placeholder="••••••••"
            />
            {/* Password rules — only show after user starts typing */}
            {touched && (
              <ul className="space-y-1 pt-1">
                {rules.map((rule) => {
                  const passing = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: passing ? 'oklch(0.76 0.15 162)' : 'var(--muted-foreground)' }}
                    >
                      {passing
                        ? <Check size={12} />
                        : <X size={12} />
                      }
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            variant="mint"
            onClick={() => register()}
            disabled={isPending || !allValid || !email}
          >
            {isPending ? 'Creating account...' : 'Register'}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}