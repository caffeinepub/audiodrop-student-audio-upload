import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Home } from 'lucide-react';

export default function SubmissionSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-2 border-green-600/20">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Your recording has been submitted successfully.</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              Your audio recording has been securely uploaded and is now available for review by authorized administrators.
            </p>
          </div>

          <Button
            onClick={() => navigate({ to: '/' })}
            className="w-full"
            size="lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
