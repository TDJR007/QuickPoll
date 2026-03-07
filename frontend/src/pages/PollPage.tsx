import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, Check } from 'lucide-react';

interface Option {
  id: string;
  text: string;
  _count: { votes: number };
}

interface Poll {
  id: string;
  question: string;
  options: Option[];
  fromCache?: boolean;
}

const MINT = 'oklch(0.76 0.15 162)';
const MINT_BG = 'oklch(0.76 0.15 162 / 15%)';

export default function PollPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [hasVoted, setHasVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const { isDark, toggle } = useThemeStore();

  const { data: poll, isLoading, error } = useQuery<Poll>({
    queryKey: ['poll', id],
    queryFn: async () => {
      const res = await api.get(`/polls/${id}/results`);
      return res.data;
    },
    refetchInterval: 10000,
  });

  const totalVotes = poll?.options.reduce((sum, o) => sum + o._count.votes, 0) ?? 0;

  const { mutate: castVote, isPending } = useMutation({
    mutationFn: async (optionId: string) => {
      await api.post(`/polls/${id}/vote`, { optionId });
      return optionId;
    },
    onSuccess: (optionId) => {
      setHasVoted(true);
      setVotedOptionId(optionId);
      queryClient.invalidateQueries({ queryKey: ['poll', id] });
    },
  });

  const copyLink = () => navigator.clipboard.writeText(window.location.href);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Loading poll...</p>
    </div>
  );

  if (error || !poll) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">Poll not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">QuickPoll</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyLink}>Copy Link</Button>
            <Button variant="outline" size="sm" onClick={toggle}>
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg sm:text-xl leading-snug">{poll.question}</CardTitle>
            <CardDescription>
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} total
              {poll.fromCache && <span className="ml-2 text-xs">(cached)</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 px-3 sm:px-6">
            {poll.options.map((option) => {
              const isVoted = votedOptionId === option.id;
              const percentage = totalVotes > 0
                ? Math.round((option._count.votes / totalVotes) * 100)
                : 0;
              const showResults = hasVoted || totalVotes > 0;

              return (
                <button
                  key={option.id}
                  onClick={() => user && castVote(option.id)}
                  disabled={isPending || !user}
                  className="w-full text-left rounded-lg px-3 py-2 transition-colors duration-150 disabled:cursor-default"
                  style={{
                    backgroundColor: isVoted ? MINT_BG : 'transparent',
                  }}
                >
                  {/* Option name + vote count row */}
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {user ? (
                        <span
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{
                            borderColor: MINT,
                            backgroundColor: isVoted ? MINT : 'transparent',
                          }}
                        >
                          {isVoted && <Check size={10} color="white" strokeWidth={3} />}
                        </span>
                      ) : null}
                      <span>{option.text}</span>
                    </div>
                    {showResults && (
                      <span className="text-sm text-muted-foreground ml-2 shrink-0">
                        {option._count.votes.toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {showResults && (
                    <div
                      className="h-1.5 rounded-full w-full overflow-hidden"
                      style={{ backgroundColor: MINT_BG }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: MINT,
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}

            {!user && (
              <p className="text-sm text-muted-foreground text-center pt-4">
                <a href="/login" className="underline">Login</a> to vote.
              </p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}