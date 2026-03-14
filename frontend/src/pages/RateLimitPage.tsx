import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import lumbergh from '../assets/lumbergh.jpg';

export default function RateLimitPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6">
      <img
        src={lumbergh}
        alt="Bill Lumbergh"
        className="w-80 rounded-xl shadow-lg"
      />
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Please chill before I have to sell my keyboard to pay the API bill</h1>
        <p className="text-muted-foreground text-sm">
          You've made too many requests. Take a coffee break and try again in a few minutes.
        </p>
      </div>
      <Button variant="outline" onClick={() => navigate(-1)}>
        Go Back
      </Button>
    </div>
  );
}