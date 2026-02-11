import { CheckCircle } from 'lucide-react';

export default function SubmissionSuccessPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold">
          Your recording has been submitted successfully.
        </h1>
      </div>
    </div>
  );
}
