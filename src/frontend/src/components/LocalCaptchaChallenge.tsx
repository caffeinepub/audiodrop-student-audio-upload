import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';

interface LocalCaptchaChallengeProps {
  onSuccess: () => void;
  onFail: () => void;
}

export default function LocalCaptchaChallenge({ onSuccess, onFail }: LocalCaptchaChallengeProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const generateChallenge = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setAnswer('');
    setError('');
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctAnswer = num1 + num2;
    const userAnswer = parseInt(answer, 10);

    if (userAnswer === correctAnswer) {
      onSuccess();
    } else {
      setError('Incorrect answer. Please try again.');
      onFail();
      generateChallenge();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Verification Required</CardTitle>
        <CardDescription>Please solve this simple math problem to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold bg-muted px-6 py-3 rounded-lg">
              {num1} + {num2} = ?
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={generateChallenge}
              aria-label="Generate new challenge"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="captcha-answer">Your Answer</Label>
            <Input
              id="captcha-answer"
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the sum"
              required
              autoComplete="off"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <Button type="submit" className="w-full">
            Verify
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
